/**
 * API Client Module with JWT Authentication & Offline Fallback Engine
 * Handles connection to http://127.0.0.1:8001/ with JWT tokens
 */

import {
  MOCK_ALUMNOS,
  MOCK_PROFESORES,
  MOCK_USUARIOS,
  MOCK_GRUPOS,
  MOCK_ASISTENCIAS,
  MOCK_ESTADISTICAS_ASISTENCIA,
  MOCK_REPRESENTANTES
} from './mockData.js';

export class ApiClient {
  constructor(baseUrl = 'http://127.0.0.1:8000') {
    this.baseUrl = baseUrl;
    this.accessToken = localStorage.getItem('jwt_access_token') || null;
    this.refreshToken = localStorage.getItem('jwt_refresh_token') || null;
    this.useMock = false; // Will auto-switch if backend is unreachable
    this.onStatusChange = null;
  }

  setStatusCallback(fn) {
    this.onStatusChange = fn;
  }

  notifyStatus(online, message) {
    if (this.onStatusChange) {
      this.onStatusChange({ online, message, useMock: this.useMock });
    }
  }

  // --- JWT AUTHENTICATION ---
  async login(username, password) {
    try {
      const res = await fetch(`${this.baseUrl}/api/token/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (!res.ok) {
        throw new Error(`Error de autenticación (${res.status})`);
      }

      const data = await res.json();
      this.accessToken = data.access;
      this.refreshToken = data.refresh;
      localStorage.setItem('jwt_access_token', this.accessToken);
      localStorage.setItem('jwt_refresh_token', this.refreshToken);
      this.useMock = false;
      this.notifyStatus(true, 'Autenticado contra servidor backend');
      return { success: true, tokens: data };
    } catch (err) {
      console.warn('Login contra backend falló, usando simulación local JWT:', err.message);
      // Fallback local login simulation
      this.accessToken = 'mock_access_token_' + Date.now();
      this.refreshToken = 'mock_refresh_token_' + Date.now();
      localStorage.setItem('jwt_access_token', this.accessToken);
      localStorage.setItem('jwt_refresh_token', this.refreshToken);
      this.useMock = true;
      this.notifyStatus(false, 'Modo Local / Servidor no disponible');
      return { success: true, mock: true, user: { username, role: 'Administrador' } };
    }
  }

  async refreshAuthToken() {
    if (!this.refreshToken) return false;
    try {
      const res = await fetch(`${this.baseUrl}/api/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: this.refreshToken })
      });
      if (res.ok) {
        const data = await res.json();
        this.accessToken = data.access;
        localStorage.setItem('jwt_access_token', this.accessToken);
        return true;
      }
    } catch (e) {
      console.error('Error refrescando token JWT:', e);
    }
    return false;
  }

  logout() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('jwt_access_token');
    localStorage.removeItem('jwt_refresh_token');
    this.notifyStatus(false, 'Sesión cerrada');
  }

  // Generic request with auth header & automatic retry on 401
  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    try {
      const res = await fetch(`${this.baseUrl}${endpoint}`, { ...options, headers });

      if (res.status === 401 && this.refreshToken) {
        const refreshed = await this.refreshAuthToken();
        if (refreshed) {
          headers['Authorization'] = `Bearer ${this.accessToken}`;
          const retryRes = await fetch(`${this.baseUrl}${endpoint}`, { ...options, headers });
          if (retryRes.ok) return await retryRes.json();
        }
      }

      if (res.ok) {
        this.useMock = false;
        this.notifyStatus(true, 'Conectado a Backend REST API (127.0.0.1:8000)');
        return await res.json();
      } else {
        throw new Error(`HTTP Error ${res.status}`);
      }
    } catch (err) {
      this.useMock = true;
      this.notifyStatus(false, `Modo Simulación / Backend Inalcanzable (${err.message})`);
      return null;
    }
  }

  // --- MODULE 1: ALUMNOS / FICHA DEL ESTUDIANTE ---
  async getAlumnos() {
    const res = await this.request('/academico/alumnos/');
    if (res) return res;
    // Fallback Mock
    return MOCK_ALUMNOS;
  }

  async getAlumnosPorSeccion(grado, seccion, periodo = null) {
    let url = `/academico/alumnos/por_seccion/?grado=${encodeURIComponent(grado)}&seccion=${encodeURIComponent(seccion)}`;
    if (periodo) url += `&periodo=${encodeURIComponent(periodo)}`;
    const res = await this.request(url);
    if (res) return res;
    // Fallback Mock
    return MOCK_ALUMNOS.filter(a => a.grado === grado && a.seccion === seccion);
  }

  async createAlumno(alumnoData) {
    const res = await this.request('/academico/alumnos/', {
      method: 'POST',
      body: JSON.stringify(alumnoData)
    });
    if (res) return res;
    // Fallback Mock
    const newAlumno = { id_alumno: MOCK_ALUMNOS.length + 1, ...alumnoData };
    MOCK_ALUMNOS.push(newAlumno);
    return newAlumno;
  }

  async updateAlumno(id, alumnoData) {
    const res = await this.request(`/academico/alumnos/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(alumnoData)
    });
    if (res) return res;
    // Fallback Mock
    const index = MOCK_ALUMNOS.findIndex(a => a.id_alumno === id);
    if (index !== -1) {
      MOCK_ALUMNOS[index] = { ...MOCK_ALUMNOS[index], ...alumnoData };
      return MOCK_ALUMNOS[index];
    }
    return null;
  }

  async getRepresentantes() {
    const res = await this.request('/personal/representantes/');
    if (res) return res;
    return MOCK_REPRESENTANTES;
  }

  async getAlumnoRepresentantes() {
    const res = await this.request('/personal/alumno-representante/');
    if (res) return res;
    // Return structured bindings from mock
    return MOCK_ALUMNOS.flatMap(a => (a.representantes || []).map(r => ({
      alumno_id: a.id_alumno,
      alumno_nombre: `${a.primer_nombre} ${a.primer_apellido}`,
      ...r
    })));
  }

  // --- MODULE 2: PERSONAL DOCENTE Y ADMINISTRATIVO ---
  async getProfesores() {
    const res = await this.request('/personal/personal-con-cargos/');
    if (res) return res;
    return MOCK_PROFESORES;
  }

  async createProfesor(profesorData) {
    const res = await this.request('/personal/personal-con-cargos/', {
      method: 'POST',
      body: JSON.stringify(profesorData)
    });
    if (res) return res;
    // Fallback Mock
    const newProfesor = { id_profesor: MOCK_PROFESORES.length + 1, ...profesorData };
    MOCK_PROFESORES.push(newProfesor);
    return newProfesor;
  }

  async updateProfesor(id, profesorData) {
    const res = await this.request(`/personal/personal-con-cargos/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(profesorData)
    });
    if (res) return res;
    // Fallback Mock
    const index = MOCK_PROFESORES.findIndex(p => p.id_profesor === id);
    if (index !== -1) {
      MOCK_PROFESORES[index] = { ...MOCK_PROFESORES[index], ...profesorData };
      return MOCK_PROFESORES[index];
    }
    return null;
  }

  async getUsuarios() {
    const res = await this.request('/core/usuarios/');
    if (res) return res;
    return MOCK_USUARIOS;
  }

  // --- MODULE 3: DASHBOARD Y ASISTENCIAS EN TIEMPO REAL ---
  async getGrupos() {
    const res = await this.request('/academico/grupos/');
    if (res) return res;
    return MOCK_GRUPOS;
  }

  async getAsistencias(grupoId = null) {
    let url = '/academico/asistencias/';
    if (grupoId) url += `?grupo_id=${grupoId}`;
    const res = await this.request(url);
    if (res) return res;
    if (grupoId) {
      return MOCK_ASISTENCIAS.filter(a => a.grupo_id === parseInt(grupoId));
    }
    return MOCK_ASISTENCIAS;
  }

  async getEstadisticasAsistencia(grupoId = null, fechaInicio = '', fechaFin = '') {
    let query = [];
    if (grupoId) query.push(`grupo_id=${grupoId}`);
    if (fechaInicio) query.push(`fecha_inicio=${fechaInicio}`);
    if (fechaFin) query.push(`fecha_fin=${fechaFin}`);

    const queryString = query.length ? '?' + query.join('&') : '';
    const res = await this.request(`/academico/asistencias/estadisticas/${queryString}`);
    if (res) return res;

    // Filter mock stats if needed
    if (grupoId) {
      const g = MOCK_ESTADISTICAS_ASISTENCIA.por_grupo.find(p => p.grupo_id === parseInt(grupoId));
      if (g) {
        return {
          global: {
            total_estudiantes: g.total,
            presentes: g.presentes,
            ausentes: g.ausentes,
            justificados: g.justificados,
            porcentaje_asistencia: g.porcentaje
          },
          por_grupo: [g],
          historico_semanal: MOCK_ESTADISTICAS_ASISTENCIA.historico_semanal
        };
      }
    }
    return MOCK_ESTADISTICAS_ASISTENCIA;
  }

  // Registrar / actualizar asistencia en tiempo real
  async registrarAsistencia(asistenciaData) {
    // try backend POST
    const res = await this.request('/academico/asistencias/', {
      method: 'POST',
      body: JSON.stringify(asistenciaData)
    });
    if (res) return res;

    // Mock local updates
    const existing = MOCK_ASISTENCIAS.find(
      a => a.alumno_id === asistenciaData.alumno_id && a.fecha === asistenciaData.fecha
    );
    if (existing) {
      existing.estado = asistenciaData.estado;
      existing.observacion = asistenciaData.observacion || existing.observacion;
      return existing;
    } else {
      const newItem = {
        id: Date.now(),
        ...asistenciaData
      };
      MOCK_ASISTENCIAS.push(newItem);
      return newItem;
    }
  }
}

export const api = new ApiClient();

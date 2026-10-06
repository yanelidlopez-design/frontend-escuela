/**
 * Dashboard & Real-Time Attendance Widget Component Controller
 */

import { api } from '../api.js';

export class DashboardComponent {
  constructor() {
    this.grupos = [];
    this.selectedGrupoId = null;
    this.selectedFecha = new Date().toISOString().split('T')[0];
    this.stats = null;
    this.asistenciasGrupo = [];
  }

  async render(container) {
    container.innerHTML = `
      <!-- Top Filters Bar -->
      <div class="filters-bar">
        <div class="form-group">
          <label>Fecha de Control</label>
          <input type="date" id="dash-date" class="form-control" value="${this.selectedFecha}">
        </div>

        <div class="form-group">
          <label>Grado / Sección</label>
          <select id="dash-grupo-select" class="form-select">
            <option value="">-- Todos los Grupos (Vista General) --</option>
          </select>
        </div>

        <button id="btn-refresh-dash" class="btn btn-secondary" style="margin-top: auto;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
          Actualizar Estadísticas
        </button>

        <div style="margin-left: auto; display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; color: var(--accent-emerald);">
          <span class="status-indicator pulse"></span>
          <span>Transmisión en Tiempo Real Activa</span>
        </div>
      </div>

      <!-- KPI Summary Cards -->
      <div class="grid-stats">
        <div class="stat-card emerald">
          <div class="stat-header">
            <span>Presentes (P)</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <div class="stat-value" id="kpi-presentes">0</div>
          <div class="stat-footer">
            <span class="trend-up" id="kpi-presentes-pct">0%</span> del total de alumnos
          </div>
        </div>

        <div class="stat-card rose">
          <div class="stat-header">
            <span>Ausentes (A)</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          </div>
          <div class="stat-value" id="kpi-ausentes">0</div>
          <div class="stat-footer">
            <span class="trend-down" id="kpi-ausentes-pct">0%</span> faltas registradas
          </div>
        </div>

        <div class="stat-card cyan">
          <div class="stat-header">
            <span>Justificados (J)</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          </div>
          <div class="stat-value" id="kpi-justificados">0</div>
          <div class="stat-footer">
            <span id="kpi-justificados-pct">0%</span> permisos médicos / causa
          </div>
        </div>
      </div>

      <!-- Main Widget Grid -->
      <div class="dashboard-grid">
        <!-- Interactive Real-Time Attendance Roll Call Matrix -->
        <div class="widget-box">
          <div class="widget-header">
            <div class="widget-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
              <span>Matriz de Registro de Asistencia en Tiempo Real</span>
            </div>
            <span class="badge badge-presente" id="live-rollcall-badge">Control Diario</span>
          </div>

          <p style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 1rem;">
            Marque el estado de cada estudiante para el grupo seleccionado. Los cambios actualizan instantáneamente las métricas del sistema.
          </p>

          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Estudiante</th>
                  <th>Grado/Secc</th>
                  <th>Estado de Asistencia</th>
                  <th>Observación</th>
                </tr>
              </thead>
              <tbody id="attendance-rollcall-body">
                <tr><td colspan="4" style="text-align:center; padding: 2rem;">Cargando estudiantes...</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Attendance Performance & Group Breakdown -->
        <div style="display: flex; flex-direction: column; gap: 1.5rem;">
          <div class="widget-box">
            <div class="widget-header">
              <div class="widget-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                <span>Efectividad Global</span>
              </div>
            </div>
            
            <div style="text-align: center; padding: 1rem 0;">
              <div style="font-size: 2.8rem; font-weight: 800; color: var(--accent-emerald);" id="overall-attendance-rate">0%</div>
              <p style="font-size: 0.8rem; color: var(--text-muted);">Tasa de Asistencia Efectiva Hoy</p>
              
              <div class="progress-bar-bg" style="margin-top: 1rem; height: 10px;">
                <div class="progress-bar-fill" id="overall-progress-bar" style="width: 0%;"></div>
              </div>
            </div>
          </div>

          <div class="widget-box">
            <div class="widget-header">
              <div class="widget-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                <span>Resumen por Sección</span>
              </div>
            </div>
            
            <div id="section-breakdown-list" style="display: flex; flex-direction: column; gap: 0.75rem;">
              <!-- Dynamic groups list -->
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents(container);
    await this.loadInitialData(container);
  }

  async loadInitialData(container) {
    this.grupos = await api.getGrupos();
    const select = container.querySelector('#dash-grupo-select');
    select.innerHTML = '<option value="">-- Todos los Grupos (Vista General) --</option>' +
      this.grupos.map(g => `<option value="${g.id}">${g.grado} "${g.seccion}" - Tutor: ${g.tutor}</option>`).join('');

    await this.refreshData(container);
  }

  bindEvents(container) {
    const grupoSelect = container.querySelector('#dash-grupo-select');
    const dateInput = container.querySelector('#dash-date');
    const refreshBtn = container.querySelector('#btn-refresh-dash');

    grupoSelect.addEventListener('change', (e) => {
      this.selectedGrupoId = e.target.value;
      this.refreshData(container);
    });

    dateInput.addEventListener('change', (e) => {
      this.selectedFecha = e.target.value;
      this.refreshData(container);
    });

    refreshBtn.addEventListener('click', () => {
      this.refreshData(container);
    });
  }

  async refreshData(container) {
    this.stats = await api.getEstadisticasAsistencia(this.selectedGrupoId, this.selectedFecha, this.selectedFecha);
    this.asistenciasGrupo = await api.getAsistencias(this.selectedGrupoId);

    // Update KPIs
    const g = this.stats.global || {};
    const total = g.total_estudiantes || 1;
    const p = g.presentes || 0;
    const a = g.ausentes || 0;
    const j = g.justificados || 0;
    const rate = g.porcentaje_asistencia || Math.round((p / total) * 100);

    container.querySelector('#kpi-presentes').innerText = p;
    container.querySelector('#kpi-presentes-pct').innerText = `${Math.round((p / total) * 100)}%`;

    container.querySelector('#kpi-ausentes').innerText = a;
    container.querySelector('#kpi-ausentes-pct').innerText = `${Math.round((a / total) * 100)}%`;

    container.querySelector('#kpi-justificados').innerText = j;
    container.querySelector('#kpi-justificados-pct').innerText = `${Math.round((j / total) * 100)}%`;

    container.querySelector('#overall-attendance-rate').innerText = `${rate}%`;
    container.querySelector('#overall-progress-bar').style.width = `${rate}%`;

    // Render Roll Call Table Matrix
    const tbody = container.querySelector('#attendance-rollcall-body');
    const alumnos = await api.getAlumnos();
    
    let filteredAlumnos = alumnos;
    if (this.selectedGrupoId) {
      filteredAlumnos = alumnos.filter(al => al.grupo_id === parseInt(this.selectedGrupoId));
    }

    if (filteredAlumnos.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color: var(--text-muted);">No hay estudiantes registrados en este filtro.</td></tr>`;
      return;
    }

    tbody.innerHTML = filteredAlumnos.map(al => {
      const attendanceRec = this.asistenciasGrupo.find(rec => rec.alumno_id === al.id_alumno) || { estado: 'P', observacion: 'A tiempo' };
      const currentEstado = attendanceRec.estado;

      return `
        <tr data-alumno-id="${al.id_alumno}">
          <td>
            <div style="font-weight: 700;">${al.primer_nombre} ${al.primer_apellido}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">${al.tipo_documento_identidad}-${al.numero_documento_identidad}</div>
          </td>
          <td>
            <span class="badge badge-egresado">${al.grado} "${al.seccion}"</span>
          </td>
          <td>
            <div class="attendance-radio-group">
              <input type="radio" id="att-p-${al.id_alumno}" name="att-${al.id_alumno}" value="P" class="attendance-radio" ${currentEstado === 'P' ? 'checked' : ''}>
              <label for="att-p-${al.id_alumno}" class="attendance-label" title="Presente">P</label>

              <input type="radio" id="att-a-${al.id_alumno}" name="att-${al.id_alumno}" value="A" class="attendance-radio" ${currentEstado === 'A' ? 'checked' : ''}>
              <label for="att-a-${al.id_alumno}" class="attendance-label" title="Ausente">A</label>

              <input type="radio" id="att-j-${al.id_alumno}" name="att-${al.id_alumno}" value="J" class="attendance-radio" ${currentEstado === 'J' ? 'checked' : ''}>
              <label for="att-j-${al.id_alumno}" class="attendance-label" title="Justificado">J</label>
            </div>
          </td>
          <td>
            <input type="text" class="form-control att-obs-input" style="padding: 0.25rem 0.5rem; font-size:0.8rem;" value="${attendanceRec.observacion || ''}" placeholder="Anotación...">
          </td>
        </tr>
      `;
    }).join('');

    // Attach real-time event listeners to matrix radios
    tbody.querySelectorAll('.attendance-radio').forEach(radio => {
      radio.addEventListener('change', async (e) => {
        const row = e.target.closest('tr');
        const alumnoId = parseInt(row.dataset.alumnoId);
        const nuevoEstado = e.target.value;
        const obsInput = row.querySelector('.att-obs-input');

        await api.registrarAsistencia({
          alumno_id: alumnoId,
          grupo_id: this.selectedGrupoId ? parseInt(this.selectedGrupoId) : 1,
          fecha: this.selectedFecha,
          estado: nuevoEstado,
          observacion: obsInput.value
        });

        // Trigger dynamic KPI refresh
        this.refreshData(container);
      });
    });

    // Render section breakdown list
    const breakdownContainer = container.querySelector('#section-breakdown-list');
    const porGrupo = this.stats.por_grupo || [];
    breakdownContainer.innerHTML = porGrupo.map(pg => `
      <div style="background-color: var(--bg-main); padding: 0.75rem 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
        <div style="display: flex; justify-content: space-between; font-weight: 600; font-size: 0.85rem;">
          <span>${pg.grado} "${pg.seccion}"</span>
          <span style="color: var(--accent-cyan);">${pg.porcentaje}% Asist.</span>
        </div>
        <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">
          Presentes: ${pg.presentes} | Ausentes: ${pg.ausentes} | Justificados: ${pg.justificados}
        </div>
        <div class="progress-bar-bg" style="height: 4px; margin-top: 0.5rem;">
          <div class="progress-bar-fill" style="width: ${pg.porcentaje}%;"></div>
        </div>
      </div>
    `).join('');
  }
}

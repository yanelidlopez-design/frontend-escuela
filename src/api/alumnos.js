/**
 * Student Management & Ficha del Estudiante Module Component Controller
 */

import { api } from '../api.js';

export class AlumnosComponent {
  constructor() {
    this.alumnos = [];
    this.representantes = [];
    this.filteredAlumnos = [];
    this.selectedAlumno = null;
  }

  async render(container) {
    container.innerHTML = `
      <!-- Search & Filters Header -->
      <div class="filters-bar">
        <div class="form-group" style="flex: 1; min-width: 200px;">
          <label>Buscar Alumno</label>
          <input type="text" id="alumno-search" class="form-control" placeholder="Buscar por Nombre, Cédula o Cédula Escolar...">
        </div>

        <div class="form-group">
          <label>Filtro por Grado</label>
          <select id="alumno-filter-grado" class="form-select">
            <option value="">Todos los Grados</option>
            <option value="1er Año">1er Año</option>
            <option value="2do Año">2do Año</option>
            <option value="3er Año">3er Año</option>
            <option value="4to Año">4to Año</option>
            <option value="5to Año">5to Año</option>
          </select>
        </div>

        <div class="form-group">
          <label>Sección</label>
          <select id="alumno-filter-seccion" class="form-select">
            <option value="">Todas</option>
            <option value="A">Sección A</option>
            <option value="B">Sección B</option>
          </select>
        </div>

        <div class="form-group">
          <label>Estatus</label>
          <select id="alumno-filter-estatus" class="form-select">
            <option value="">Todos</option>
            <option value="Activo">Activo</option>
            <option value="Retirado">Retirado</option>
            <option value="Egresado">Egresado</option>
          </select>
        </div>

        <button id="btn-nuevo-alumno" class="btn btn-primary" style="margin-top: auto;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nuevo Estudiante
        </button>
      </div>

      <!-- Students Table -->
      <div class="widget-box">
        <div class="widget-header">
          <div class="widget-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <span>Matrícula General de Estudiantes</span>
          </div>
          <span class="badge badge-justificado" id="total-alumnos-count">0 Registros</span>
        </div>

        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Cédula / Céd. Escolar</th>
                <th>Nombre Completo</th>
                <th>Grado y Sección</th>
                <th>Género / Sangre</th>
                <th>Estatus General</th>
                <th>Representante Legal</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody id="alumnos-table-body">
              <tr><td colspan="7" style="text-align: center; padding: 2rem;">Cargando datos...</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Modal: Ficha del Estudiante Detail & Edit Drawer -->
      <div class="modal-overlay" id="modal-ficha-alumno">
        <div class="modal-container" style="max-width: 850px;">
          <div class="modal-header">
            <h3>Ficha Integral del Estudiante</h3>
            <button class="close-btn" id="close-ficha-modal">&times;</button>
          </div>

          <div class="modal-body" id="modal-ficha-body">
            <!-- Dynamic Content loaded here -->
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" id="btn-modal-cerrar">Cerrar</button>
            <button class="btn btn-primary" id="btn-modal-guardar">Guardar Ficha</button>
          </div>
        </div>
      </div>
    `;

    this.bindEvents(container);
    await this.loadData(container);
  }

  async loadData(container) {
    this.alumnos = await api.getAlumnos();
    this.representantes = await api.getRepresentantes();
    this.filteredAlumnos = [...this.alumnos];
    this.renderTable(container);
  }

  bindEvents(container) {
    const searchInput = container.querySelector('#alumno-search');
    const gradoSelect = container.querySelector('#alumno-filter-grado');
    const seccionSelect = container.querySelector('#alumno-filter-seccion');
    const estatusSelect = container.querySelector('#alumno-filter-estatus');
    const btnNuevo = container.querySelector('#btn-nuevo-alumno');

    const modal = container.querySelector('#modal-ficha-alumno');
    const closeBtn = container.querySelector('#close-ficha-modal');
    const cerrarBtn = container.querySelector('#btn-modal-cerrar');

    const filterHandler = () => {
      const q = searchInput.value.toLowerCase().trim();
      const g = gradoSelect.value;
      const sec = seccionSelect.value;
      const st = estatusSelect.value;

      this.filteredAlumnos = this.alumnos.filter(a => {
        const fullName = `${a.primer_nombre} ${a.segundo_nombre || ''} ${a.primer_apellido} ${a.segundo_apellido || ''}`.toLowerCase();
        const doc = `${a.tipo_documento_identidad}-${a.numero_documento_identidad}`.toLowerCase();
        const cescolar = (a.cedula_escolar || '').toLowerCase();

        const matchSearch = !q || fullName.includes(q) || doc.includes(q) || cescolar.includes(q);
        const matchGrado = !g || a.grado === g;
        const matchSeccion = !sec || a.seccion === sec;
        const matchEstatus = !st || a.estatus_general === st;

        return matchSearch && matchGrado && matchSeccion && matchEstatus;
      });

      this.renderTable(container);
    };

    searchInput.addEventListener('input', filterHandler);
    gradoSelect.addEventListener('change', filterHandler);
    seccionSelect.addEventListener('change', filterHandler);
    estatusSelect.addEventListener('change', filterHandler);

    btnNuevo.addEventListener('click', () => {
      this.openFichaModal(container, null);
    });

    closeBtn.addEventListener('click', () => modal.classList.remove('active'));
    cerrarBtn.addEventListener('click', () => modal.classList.remove('active'));
  }

  renderTable(container) {
    const tbody = container.querySelector('#alumnos-table-body');
    const countBadge = container.querySelector('#total-alumnos-count');

    countBadge.innerText = `${this.filteredAlumnos.length} Registros`;

    if (this.filteredAlumnos.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 2rem;">No se encontraron alumnos con los criterios seleccionados.</td></tr>`;
      return;
    }

    tbody.innerHTML = this.filteredAlumnos.map(al => {
      const repPrincipal = (al.representantes || []).find(r => r.es_principal) || (al.representantes || [])[0];
      let repName = 'Sin asignar';
      let repPhone = '';
      if (repPrincipal) {
        const rep = repPrincipal.representante || repPrincipal;
        const pNombre = rep.primer_nombre || rep.nombres || rep.nombre || '';
        const pApellido = rep.primer_apellido || rep.apellidos || '';
        repName = `${pNombre} ${pApellido}`.trim() + (repPrincipal.parentesco ? ` (${repPrincipal.parentesco})` : '');
        repPhone = rep.telefono_principal || rep.telefono || '';
      }

      let statusBadgeClass = 'badge-activo';
      if (al.estatus_general === 'Retirado') statusBadgeClass = 'badge-retirado';
      if (al.estatus_general === 'Egresado') statusBadgeClass = 'badge-egresado';

      return `
        <tr>
          <td>
            <div style="font-weight: 700; color: var(--accent-cyan);">${al.tipo_documento_identidad}-${al.numero_documento_identidad}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">Céd. Esc: ${al.cedula_escolar}</div>
          </td>
          <td>
            <div style="font-weight: 700;">${al.primer_nombre} ${al.segundo_nombre || ''} ${al.primer_apellido} ${al.segundo_apellido || ''}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">${al.lugar_nacimiento} | Nac: ${al.fecha_nacimiento}</div>
          </td>
          <td>
            <span class="badge badge-justificado">${al.grado} "${al.seccion}"</span>
          </td>
          <td>
            <div style="font-weight: 600;">Género: ${al.genero}</div>
            <div style="font-size: 0.75rem; color: var(--accent-amber);">Tipo Sangre: ${al.grupo_sanguineo}</div>
          </td>
          <td>
            <span class="badge ${statusBadgeClass}">${al.estatus_general}</span>
          </td>
          <td>
            <div style="font-size: 0.85rem; font-weight: 600;">${repName}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">${repPhone}</div>
          </td>
          <td>
            <button class="btn btn-secondary btn-sm btn-ver-ficha" data-id="${al.id_alumno}">
              <svg width="14" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              Ver Ficha
            </button>
          </td>
        </tr>
      `;
    }).join('');

    // Event listeners on table rows
    tbody.querySelectorAll('.btn-ver-ficha').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(e.currentTarget.dataset.id);
        const alumno = this.alumnos.find(a => a.id_alumno === id);
        this.openFichaModal(container, alumno);
      });
    });
  }

  openFichaModal(container, alumno) {
    const modal = container.querySelector('#modal-ficha-alumno');
    const modalBody = container.querySelector('#modal-ficha-body');
    this.selectedAlumno = alumno;

    const isEdit = !!alumno;
    const a = alumno || {
      primer_nombre: '', segundo_nombre: '', primer_apellido: '', segundo_apellido: '',
      tipo_documento_identidad: 'V', numero_documento_identidad: '', cedula_escolar: '',
      fecha_nacimiento: '', genero: 'M', lugar_nacimiento: '', nacionalidad: 'Venezolana',
      grupo_sanguineo: 'O+', peso_kg: '', talla_cm: '', fecha_inscripcion_inicial: new Date().toISOString().split('T')[0],
      estatus_general: 'Activo', grado: '1er Año', seccion: 'A',
      id_direccion_residencia: { calle: '', ciudad: '', estado: '', referencia: '' },
      representantes: []
    };

    const dir = a.id_direccion_residencia || {};

    modalBody.innerHTML = `
      <form id="form-ficha-alumno">
        <div class="detail-section-title">1. Datos de Identificación y Personales</div>
        <div class="form-grid">
          <div class="form-group">
            <label>Tipo Documento</label>
            <select id="fa-tipo-doc" class="form-select">
              <option value="V" ${a.tipo_documento_identidad === 'V' ? 'selected' : ''}>V - Venezolano</option>
              <option value="E" ${a.tipo_documento_identidad === 'E' ? 'selected' : ''}>E - Extranjero</option>
              <option value="P" ${a.tipo_documento_identidad === 'P' ? 'selected' : ''}>P - Pasaporte</option>
            </select>
          </div>

          <div class="form-group">
            <label>Número Documento / Cédula</label>
            <input type="text" id="fa-num-doc" class="form-control" value="${a.numero_documento_identidad}" required>
          </div>

          <div class="form-group">
            <label>Cédula Escolar</label>
            <input type="text" id="fa-ced-escolar" class="form-control" value="${a.cedula_escolar}">
          </div>

          <div class="form-group">
            <label>Primer Nombre *</label>
            <input type="text" id="fa-nombre1" class="form-control" value="${a.primer_nombre}" required>
          </div>

          <div class="form-group">
            <label>Segundo Nombre</label>
            <input type="text" id="fa-nombre2" class="form-control" value="${a.segundo_nombre || ''}">
          </div>

          <div class="form-group">
            <label>Primer Apellido *</label>
            <input type="text" id="fa-apellido1" class="form-control" value="${a.primer_apellido}" required>
          </div>

          <div class="form-group">
            <label>Segundo Apellido</label>
            <input type="text" id="fa-apellido2" class="form-control" value="${a.segundo_apellido || ''}">
          </div>

          <div class="form-group">
            <label>Fecha de Nacimiento</label>
            <input type="date" id="fa-fecha-nac" class="form-control" value="${a.fecha_nacimiento}">
          </div>

          <div class="form-group">
            <label>Género</label>
            <select id="fa-genero" class="form-select">
              <option value="Masculino" ${a.genero === 'Masculino' || a.genero === 'M' ? 'selected' : ''}>Masculino</option>
              <option value="Femenino" ${a.genero === 'Femenino' || a.genero === 'F' ? 'selected' : ''}>Femenino</option>
            </select>
          </div>

          <div class="form-group">
            <label>Nacionalidad</label>
            <input type="text" id="fa-nacionalidad" class="form-control" value="${a.nacionalidad}">
          </div>

          <div class="form-group">
            <label>Lugar de Nacimiento</label>
            <input type="text" id="fa-lugar-nac" class="form-control" value="${a.lugar_nacimiento}">
          </div>
        </div>

        <div class="detail-section-title">2. Datos Antropométricos y Médicos</div>
        <div class="form-grid">
          <div class="form-group">
            <label>Grupo Sanguíneo</label>
            <select id="fa-sangre" class="form-select">
              <option value="O+" ${a.grupo_sanguineo === 'O+' ? 'selected' : ''}>O+</option>
              <option value="O-" ${a.grupo_sanguineo === 'O-' ? 'selected' : ''}>O-</option>
              <option value="A+" ${a.grupo_sanguineo === 'A+' ? 'selected' : ''}>A+</option>
              <option value="A-" ${a.grupo_sanguineo === 'A-' ? 'selected' : ''}>A-</option>
              <option value="B+" ${a.grupo_sanguineo === 'B+' ? 'selected' : ''}>B+</option>
              <option value="AB+" ${a.grupo_sanguineo === 'AB+' ? 'selected' : ''}>AB+</option>
              <option value="AB-" ${a.grupo_sanguineo === 'AB-' ? 'selected' : ''}>AB-</option>
            </select>
          </div>

          <div class="form-group">
            <label>Peso (Kg)</label>
            <input type="number" step="0.1" id="fa-peso" class="form-control" value="${a.peso_kg || ''}">
          </div>

          <div class="form-group">
            <label>Talla (cm)</label>
            <input type="number" step="0.5" id="fa-talla" class="form-control" value="${a.talla_cm || ''}">
          </div>
        </div>

        <div class="detail-section-title">3. Ubicación Académica y Dirección de Residencia</div>
        <div class="form-grid">
          <div class="form-group">
            <label>Grado Asignado</label>
            <select id="fa-grado" class="form-select">
              <option value="1er Año" ${a.grado === '1er Año' ? 'selected' : ''}>1er Año</option>
              <option value="2do Año" ${a.grado === '2do Año' ? 'selected' : ''}>2do Año</option>
              <option value="3er Año" ${a.grado === '3er Año' ? 'selected' : ''}>3er Año</option>
              <option value="4to Año" ${a.grado === '4to Año' ? 'selected' : ''}>4to Año</option>
              <option value="5to Año" ${a.grado === '5to Año' ? 'selected' : ''}>5to Año</option>
            </select>
          </div>

          <div class="form-group">
            <label>Sección</label>
            <select id="fa-seccion" class="form-select">
              <option value="A" ${a.seccion === 'A' ? 'selected' : ''}>A</option>
              <option value="B" ${a.seccion === 'B' ? 'selected' : ''}>B</option>
            </select>
          </div>

          <div class="form-group">
            <label>Estatus General</label>
            <select id="fa-estatus" class="form-select">
              <option value="Activo" ${a.estatus_general === 'Activo' ? 'selected' : ''}>Activo</option>
              <option value="Retirado" ${a.estatus_general === 'Retirado' ? 'selected' : ''}>Retirado</option>
              <option value="Egresado" ${a.estatus_general === 'Egresado' ? 'selected' : ''}>Egresado</option>
            </select>
          </div>

          <div class="form-group form-grid-full">
            <label>Calle / Avenida / Residencia</label>
            <input type="text" id="fa-calle" class="form-control" value="${dir.calle || ''}">
          </div>

          <div class="form-group">
            <label>Ciudad</label>
            <input type="text" id="fa-ciudad" class="form-control" value="${dir.ciudad || 'Caracas'}">
          </div>

          <div class="form-group">
            <label>Estado</label>
            <input type="text" id="fa-estado" class="form-control" value="${dir.estado || 'Distrito Capital'}">
          </div>

          <div class="form-group form-grid-full">
            <label>Punto de Referencia</label>
            <input type="text" id="fa-referencia" class="form-control" value="${dir.referencia || ''}">
          </div>
        </div>

        <div class="detail-section-title">4. Representante Legal Vinculado</div>
        <div style="background-color: var(--bg-main); padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
          ${(a.representantes && a.representantes.length > 0) ? a.representantes.map(r => {
            const rep = r.representante || r;
            const pNombre = rep.primer_nombre || rep.nombres || rep.nombre || '';
            const pApellido = rep.primer_apellido || rep.apellidos || '';
            const docTipo = rep.tipo_documento_identidad || 'V';
            const docNum = rep.numero_documento_identidad || rep.cedula || '';
            const tel = rep.telefono_principal || rep.telefono || '';
            return `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid var(--border-color);">
              <div>
                <div style="font-weight: 700;">${pNombre} ${pApellido} (${r.parentesco || 'Representante'})</div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">${docTipo}-${docNum} | Tel: ${tel}</div>
              </div>
              <div>
                ${r.es_principal ? '<span class="badge badge-presente">Representante Principal</span>' : '<span class="badge badge-justificado">Secundario</span>'}
              </div>
            </div>
          `}).join('') : '<p style="font-size: 0.82rem; color: var(--text-muted);">Sin representante legal asignado aún.</p>'}
        </div>
      </form>
    `;

    modal.classList.add('active');

    // Save handler
    const saveBtn = container.querySelector('#btn-modal-guardar');
    saveBtn.onclick = () => {
      const form = container.querySelector('#form-ficha-alumno');
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const updated = {
        id_alumno: isEdit ? a.id_alumno : Date.now(),
        primer_nombre: container.querySelector('#fa-nombre1').value,
        segundo_nombre: container.querySelector('#fa-nombre2').value,
        primer_apellido: container.querySelector('#fa-apellido1').value,
        segundo_apellido: container.querySelector('#fa-apellido2').value,
        tipo_documento_identidad: container.querySelector('#fa-tipo-doc').value,
        numero_documento_identidad: container.querySelector('#fa-num-doc').value,
        cedula_escolar: container.querySelector('#fa-ced-escolar').value,
        fecha_nacimiento: container.querySelector('#fa-fecha-nac').value,
        genero: container.querySelector('#fa-genero').value,
        nacionalidad: container.querySelector('#fa-nacionalidad').value,
        lugar_nacimiento: container.querySelector('#fa-lugar-nac').value,
        grupo_sanguineo: container.querySelector('#fa-sangre').value,
        peso_kg: parseFloat(container.querySelector('#fa-peso').value) || 0,
        talla_cm: parseFloat(container.querySelector('#fa-talla').value) || 0,
        grado: container.querySelector('#fa-grado').value,
        seccion: container.querySelector('#fa-seccion').value,
        estatus_general: container.querySelector('#fa-estatus').value,
        id_direccion_residencia: {
          calle: container.querySelector('#fa-calle').value,
          ciudad: container.querySelector('#fa-ciudad').value,
          estado: container.querySelector('#fa-estado').value,
          referencia: container.querySelector('#fa-referencia').value
        },
        representantes: a.representantes
      };

      if (isEdit) {
        // Actualizar alumno existente
        const result = await api.updateAlumno(a.id_alumno, updated);
        if (result) {
          const idx = this.alumnos.findIndex(x => x.id_alumno === a.id_alumno);
          if (idx !== -1) this.alumnos[idx] = result;
          alert('Alumno actualizado correctamente.');
        } else {
          alert('Error al actualizar alumno.');
        }
      } else {
        // Crear nuevo alumno
        const result = await api.createAlumno(updated);
        if (result) {
          this.alumnos.unshift(result);
          alert('Alumno creado correctamente.');
        } else {
          alert('Error al crear alumno.');
        }
      }

      this.filteredAlumnos = [...this.alumnos];
      this.renderTable(container);
      modal.classList.remove('active');
    };
  }
}

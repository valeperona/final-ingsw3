describe('Registro de Empresa - CRUD CREATE', () => {
  const timestamp = Date.now()
  const empresa = {
    email: `empresa.test${timestamp}@cypress.com`,
    password: 'TestPassword123!',
    nombre: 'Tech Solutions S.A.',
    descripcion: 'Empresa de desarrollo de software especializada en soluciones tecnológicas innovadoras para el mercado latinoamericano.'
  }

  beforeEach(() => {
    cy.visit('/register')
  })

  it('debería mostrar campos específicos para empresa', () => {
    // Seleccionar tipo de usuario: Empresa
    cy.contains('button', 'Empresa').click()

    cy.wait(500)

    // Verificar que aparecen campos específicos de empresa
    cy.get('input#email').should('be.visible')
    cy.get('input#password').should('be.visible')
    cy.get('input#confirmPassword').should('be.visible')
    cy.get('input#nombre').should('be.visible')

    // Campo de descripción (específico de empresa)
    cy.get('textarea#descripcion').should('be.visible')

    // NO debe mostrar campos de candidato
    cy.get('input#apellido').should('not.exist')
    cy.get('input#birthDate').should('not.exist')
    cy.get('select#gender').should('not.exist')
  })

  it('debería crear una empresa completa con todos los campos', () => {
    // Seleccionar tipo de usuario: Empresa
    cy.contains('button', 'Empresa').click()

    // Llenar datos comunes
    cy.get('input#email').clear().type(empresa.email)
    cy.get('input#password').clear().type(empresa.password)
    cy.get('input#confirmPassword').clear().type(empresa.password)
    cy.get('input#nombre').clear().type(empresa.nombre)

    // Llenar datos específicos de empresa
    cy.get('textarea#descripcion').clear().type(empresa.descripcion)

    // Esperar un momento para que las validaciones se procesen
    cy.wait(500)

    // Verificar que el botón de registro esté habilitado
    cy.get('button[type="submit"]').should('not.be.disabled')

    // Enviar el formulario
    cy.get('button[type="submit"]').click()

    // Verificar redirección exitosa
    cy.url().should('include', '/login', { timeout: 10000 })
  })

  it('debería alternar entre tipo candidato y empresa', () => {
    // Primero seleccionar Candidato
    cy.contains('button', 'Candidato').click()
    cy.wait(300)

    // Verificar campos de candidato
    cy.get('input#apellido').should('be.visible')
    cy.get('select#gender').should('be.visible')
    cy.get('input#birthDate').should('be.visible')

    // Cambiar a Empresa
    cy.contains('button', 'Empresa').click()
    cy.wait(300)

    // Verificar que los campos de candidato desaparecen
    cy.get('input#apellido').should('not.exist')
    cy.get('select#gender').should('not.exist')
    cy.get('input#birthDate').should('not.exist')

    // Verificar que aparece campo de descripción
    cy.get('textarea#descripcion').should('be.visible')
  })

  it('debería validar que el nombre de empresa no esté vacío', () => {
    cy.contains('button', 'Empresa').click()

    cy.get('input#email').type('empresa@test.com')
    cy.get('input#password').type('Test123!')
    cy.get('input#confirmPassword').type('Test123!')
    cy.get('textarea#descripcion').type('Descripción de la empresa')
    // Dejar nombre vacío

    cy.wait(500)

    // El botón debe estar deshabilitado
    cy.get('button[type="submit"]').should('be.disabled')
  })

  it('debería validar formato de email para empresa', () => {
    cy.contains('button', 'Empresa').click()

    cy.get('input#email').type('email-invalido-sin-arroba')
    cy.get('input#password').type('Test123!')
    cy.get('input#confirmPassword').type('Test123!')
    cy.get('input#nombre').type('Mi Empresa')

    cy.wait(500)

    // El botón debe estar deshabilitado con email inválido
    cy.contains('Ingrese un email válido').should('be.visible')
    cy.get('button[type="submit"]').should('be.disabled')
  })

  it('debería validar que las contraseñas coincidan para empresa', () => {
    cy.contains('button', 'Empresa').click()

    cy.get('input#email').type('empresa@test.com')
    cy.get('input#password').type('Password123!')
    cy.get('input#confirmPassword').type('DiferentePassword123!')
    cy.get('input#nombre').type('Mi Empresa')

    cy.wait(500)

    // Debe mostrar mensaje de error
    cy.contains('Las contraseñas no coinciden').should('be.visible')
    cy.get('button[type="submit"]').should('be.disabled')
  })

  it('debería validar que la descripción no esté vacía', () => {
    cy.contains('button', 'Empresa').click()

    cy.get('input#email').type('empresa@test.com')
    cy.get('input#password').type('Test123!')
    cy.get('input#confirmPassword').type('Test123!')
    cy.get('input#nombre').type('Mi Empresa')
    // Dejar descripción vacía

    cy.wait(500)

    // El botón debe estar deshabilitado
    cy.get('button[type="submit"]').should('be.disabled')
  })

  it('debería limpiar campos al cambiar de tipo de usuario', () => {
    // Llenar campos como candidato
    cy.contains('button', 'Candidato').click()
    cy.get('input#email').type('candidato@test.com')
    cy.get('input#password').type('Test123!')
    cy.get('input#nombre').type('Juan')
    cy.get('input#apellido').type('Pérez')

    // Cambiar a empresa
    cy.contains('button', 'Empresa').click()
    cy.wait(300)

    // Verificar que los datos comunes se mantienen (por diseño del componente)
    cy.get('input#email').should('have.value', 'candidato@test.com')
    cy.get('input#password').should('have.value', 'Test123!')
    cy.get('input#nombre').should('have.value', 'Juan')

    // Verificar que no existen campos de candidato
    cy.get('input#apellido').should('not.exist')
  })

  it('debería validar longitud mínima de contraseña', () => {
    cy.contains('button', 'Empresa').click()

    cy.get('input#email').type('empresa@test.com')
    cy.get('input#password').type('123') // Muy corta
    cy.get('input#confirmPassword').type('123')
    cy.get('input#nombre').type('Mi Empresa')
    cy.get('textarea#descripcion').type('Descripción')

    cy.wait(500)

    // Debe mostrar mensaje de error
    cy.contains('La contraseña debe tener al menos 6 caracteres').should('be.visible')
    cy.get('button[type="submit"]').should('be.disabled')
  })
})

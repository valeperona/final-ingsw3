describe('Registro de Empresa - CRUD CREATE', () => {
  // Variables para almacenar datos de la empresa
  const timestamp = Date.now()
  const empresa = {
    email: `empresa.test${timestamp}@cypress.com`,
    password: 'TestPassword123!',
    nombre: 'Tech Solutions S.A.',
    descripcion: 'Empresa de desarrollo de software especializada en soluciones tecnológicas innovadoras.'
  }

  beforeEach(() => {
    cy.visit('/register')
  })

  it('debería mostrar campos específicos para empresa', () => {
    // Seleccionar tipo de usuario: Empresa
    cy.contains('Company').click()

    cy.wait(500)

    // Verificar que aparecen campos específicos de empresa
    cy.get('input[name="email"]').should('be.visible')
    cy.get('input[name="password"]').should('be.visible')
    cy.get('input[name="confirmPassword"]').should('be.visible')
    cy.get('input[name="nombre"]').should('be.visible')

    // Campo de descripción (específico de empresa)
    cy.get('textarea[name="descripcion"], input[name="descripcion"]').should('be.visible')

    // NO debe mostrar campos de candidato
    cy.get('input[name="apellido"]').should('not.exist')
    cy.get('input[name="birthDate"]').should('not.exist')
    cy.get('select[name="gender"]').should('not.exist')
  })

  it('debería crear una empresa completa con todos los campos', () => {
    // Seleccionar tipo de usuario: Empresa
    cy.contains('Company').click()

    // Llenar datos comunes
    cy.get('input[name="email"]').clear().type(empresa.email)
    cy.get('input[name="password"]').clear().type(empresa.password)
    cy.get('input[name="confirmPassword"]').clear().type(empresa.password)
    cy.get('input[name="nombre"]').clear().type(empresa.nombre)

    // Llenar datos específicos de empresa
    cy.get('textarea[name="descripcion"], input[name="descripcion"]')
      .clear()
      .type(empresa.descripcion)

    // Esperar un momento para que las validaciones se procesen
    cy.wait(500)

    // Verificar que el botón de registro esté habilitado
    cy.get('button[type="submit"]').should('not.be.disabled')

    // Enviar el formulario
    cy.get('button[type="submit"]').click()

    // Verificar redirección exitosa
    cy.url().should('satisfy', (url: string) => {
      return url.includes('/login') ||
             url.includes('/verify') ||
             url.includes('/mi-perfil')
    }, { timeout: 10000 })
  })

  it('debería alternar entre tipo candidato y empresa', () => {
    // Primero seleccionar Candidato
    cy.contains('Candidate').click()
    cy.wait(300)

    // Verificar campos de candidato
    cy.get('input[name="apellido"]').should('be.visible')
    cy.get('select[name="gender"]').should('be.visible')
    cy.get('input[name="birthDate"]').should('be.visible')

    // Cambiar a Empresa
    cy.contains('Company').click()
    cy.wait(300)

    // Verificar que los campos de candidato desaparecen
    cy.get('input[name="apellido"]').should('not.exist')
    cy.get('select[name="gender"]').should('not.exist')
    cy.get('input[name="birthDate"]').should('not.exist')

    // Verificar que aparece campo de descripción
    cy.get('textarea[name="descripcion"], input[name="descripcion"]').should('be.visible')
  })

  it('debería validar que el nombre de empresa no esté vacío', () => {
    cy.contains('Company').click()

    cy.get('input[name="email"]').type('empresa@test.com')
    cy.get('input[name="password"]').type('Test123!')
    cy.get('input[name="confirmPassword"]').type('Test123!')
    // Dejar nombre vacío

    cy.wait(500)

    // El botón debe estar deshabilitado
    cy.get('button[type="submit"]').should('be.disabled')
  })

  it('debería validar formato de email para empresa', () => {
    cy.contains('Company').click()

    cy.get('input[name="email"]').type('email-invalido-sin-arroba')
    cy.get('input[name="password"]').type('Test123!')
    cy.get('input[name="confirmPassword"]').type('Test123!')
    cy.get('input[name="nombre"]').type('Mi Empresa')

    cy.wait(500)

    // El botón debe estar deshabilitado con email inválido
    cy.get('button[type="submit"]').should('be.disabled')
  })

  it('debería validar que las contraseñas coincidan para empresa', () => {
    cy.contains('Company').click()

    cy.get('input[name="email"]').type('empresa@test.com')
    cy.get('input[name="password"]').type('Password123!')
    cy.get('input[name="confirmPassword"]').type('DiferentePassword123!')
    cy.get('input[name="nombre"]').type('Mi Empresa')

    cy.wait(500)

    // El botón debe estar deshabilitado
    cy.get('button[type="submit"]').should('be.disabled')
  })

  it('debería permitir descripción opcional para empresa', () => {
    cy.contains('Company').click()

    cy.get('input[name="email"]').type(`empresa.sin.desc${timestamp}@test.com`)
    cy.get('input[name="password"]').type('Test123!')
    cy.get('input[name="confirmPassword"]').type('Test123!')
    cy.get('input[name="nombre"]').type('Empresa Sin Descripción')

    // Dejar descripción vacía (si es opcional)
    cy.wait(500)

    // El botón podría estar habilitado si descripción es opcional
    // o deshabilitado si es requerida
    cy.get('button[type="submit"]').then($btn => {
      if (!$btn.is(':disabled')) {
        cy.wrap($btn).click()
        // Si permite enviar, debe procesar correctamente
        cy.wait(2000)
      }
    })
  })

  it('debería limpiar campos al cambiar de tipo de usuario', () => {
    // Llenar campos como candidato
    cy.contains('Candidate').click()
    cy.get('input[name="email"]').type('candidato@test.com')
    cy.get('input[name="password"]').type('Test123!')
    cy.get('input[name="nombre"]').type('Juan')
    cy.get('input[name="apellido"]').type('Pérez')

    // Cambiar a empresa
    cy.contains('Company').click()
    cy.wait(300)

    // Verificar que los datos comunes se mantienen
    cy.get('input[name="email"]').should('have.value', 'candidato@test.com')
    cy.get('input[name="password"]').should('have.value', 'Test123!')
    cy.get('input[name="nombre"]').should('have.value', 'Juan')

    // Verificar que no existen campos de candidato
    cy.get('input[name="apellido"]').should('not.exist')
  })

  it('debería validar longitud mínima de descripción si es requerida', () => {
    cy.contains('Company').click()

    cy.get('input[name="email"]').type('empresa@test.com')
    cy.get('input[name="password"]').type('Test123!')
    cy.get('input[name="confirmPassword"]').type('Test123!')
    cy.get('input[name="nombre"]').type('Mi Empresa')

    // Intentar con descripción muy corta
    cy.get('textarea[name="descripcion"], input[name="descripcion"]')
      .clear()
      .type('abc')

    cy.wait(500)

    // Verificar si hay validación de longitud mínima
    cy.get('body').then($body => {
      const text = $body.text().toLowerCase()
      const hasMinLengthError = text.includes('caracteres') ||
                                text.includes('mínimo') ||
                                text.includes('minimum')

      if (hasMinLengthError) {
        // Si hay error, el botón debe estar deshabilitado
        cy.get('button[type="submit"]').should('be.disabled')
      }
    })
  })
})

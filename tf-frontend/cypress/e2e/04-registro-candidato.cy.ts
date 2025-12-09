describe('Registro de Candidato - CRUD CREATE', () => {
  // Variables para almacenar datos del candidato
  const timestamp = Date.now()
  const candidato = {
    email: `candidato.test${timestamp}@cypress.com`,
    password: 'TestPassword123!',
    nombre: 'Juan Carlos',
    apellido: 'García López',
    gender: 'masculino',
    birthDate: '1995-05-15'
  }

  beforeEach(() => {
    cy.visit('/register')
  })

  it('debería mostrar el formulario de registro', () => {
    cy.url().should('include', '/register')
    cy.contains('Create your account').should('be.visible')

    // Verificar que el selector de tipo de usuario existe
    cy.get('.user-type-selector').should('be.visible')
    cy.contains('Candidate').should('be.visible')
    cy.contains('Company').should('be.visible')
  })

  it('debería crear un candidato completo con todos los campos', () => {
    // Seleccionar tipo de usuario: Candidato
    cy.contains('Candidate').click()

    // Llenar datos comunes
    cy.get('input[name="email"]').clear().type(candidato.email)
    cy.get('input[name="password"]').clear().type(candidato.password)
    cy.get('input[name="confirmPassword"]').clear().type(candidato.password)
    cy.get('input[name="nombre"]').clear().type(candidato.nombre)

    // Llenar datos específicos de candidato
    cy.get('input[name="apellido"]').clear().type(candidato.apellido)

    // Seleccionar género
    cy.get('select[name="gender"]').select(candidato.gender)

    // Ingresar fecha de nacimiento
    cy.get('input[name="birthDate"]').clear().type(candidato.birthDate)

    // Esperar un momento para que las validaciones se procesen
    cy.wait(500)

    // Verificar que el botón de registro esté habilitado
    cy.get('button[type="submit"]').should('not.be.disabled')

    // Enviar el formulario
    cy.get('button[type="submit"]').click()

    // Verificar redirección exitosa o mensaje de éxito
    // Puede redirigir a login o mostrar mensaje de verificación de email
    cy.url().should('satisfy', (url: string) => {
      return url.includes('/login') ||
             url.includes('/verify') ||
             url.includes('/mi-perfil')
    }, { timeout: 10000 })
  })

  it('debería validar que el candidato sea mayor de 18 años', () => {
    cy.contains('Candidate').click()

    // Llenar campos básicos
    cy.get('input[name="email"]').type('menor@test.com')
    cy.get('input[name="password"]').type('Test123!')
    cy.get('input[name="confirmPassword"]').type('Test123!')
    cy.get('input[name="nombre"]').type('Juan')
    cy.get('input[name="apellido"]').type('Pérez')

    // Ingresar fecha de nacimiento de menor de edad
    const fechaMenor = new Date()
    fechaMenor.setFullYear(fechaMenor.getFullYear() - 15) // 15 años
    const fechaFormateada = fechaMenor.toISOString().split('T')[0]

    cy.get('input[name="birthDate"]').clear().type(fechaFormateada)

    // Esperar que se muestre el mensaje de error
    cy.wait(500)

    // Verificar que muestra error o deshabilita el botón
    cy.get('body').should('contain.text', '18')
  })

  it('debería validar que las contraseñas coincidan', () => {
    cy.contains('Candidate').click()

    cy.get('input[name="email"]').type('test@test.com')
    cy.get('input[name="password"]').type('Password123!')
    cy.get('input[name="confirmPassword"]').type('DiferentePassword123!')

    cy.get('input[name="nombre"]').type('Test')

    // Verificar que muestra mensaje de error o deshabilita botón
    cy.wait(500)
    cy.get('button[type="submit"]').should('be.disabled')
  })

  it('debería validar formato de email', () => {
    cy.contains('Candidate').click()

    cy.get('input[name="email"]').type('email-invalido')
    cy.get('input[name="password"]').type('Test123!')
    cy.get('input[name="confirmPassword"]').type('Test123!')

    // El botón debe estar deshabilitado con email inválido
    cy.wait(500)
    cy.get('button[type="submit"]').should('be.disabled')
  })

  it('debería validar que el apellido solo contenga letras', () => {
    cy.contains('Candidate').click()

    cy.get('input[name="email"]').type('test@test.com')
    cy.get('input[name="password"]').type('Test123!')
    cy.get('input[name="confirmPassword"]').type('Test123!')
    cy.get('input[name="nombre"]').type('Juan')

    // Intentar escribir números en apellido
    cy.get('input[name="apellido"]').type('García123')

    // El campo debe sanitizar y solo mantener letras
    cy.get('input[name="apellido"]').should('have.value', 'García')
  })
})

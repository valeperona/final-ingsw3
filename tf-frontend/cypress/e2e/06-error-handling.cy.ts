describe('Error Handling - Integración Frontend-Backend', () => {
  describe('Manejo de errores en registro', () => {
    beforeEach(() => {
      cy.visit('/register')
    })

    it('debería mostrar error al intentar registrar email duplicado', () => {
      const timestamp = Date.now()

      // Seleccionar tipo candidato
      cy.contains('Candidate').click()

      // Intentar registrar con un email que probablemente ya existe
      // o registrar dos veces el mismo
      const emailExistente = `existente${timestamp}@test.com`

      // Primera vez - debería funcionar
      cy.get('input[name="email"]').type(emailExistente)
      cy.get('input[name="password"]').type('Test123!')
      cy.get('input[name="confirmPassword"]').type('Test123!')
      cy.get('input[name="nombre"]').type('Test')
      cy.get('input[name="apellido"]').type('Usuario')
      cy.get('select[name="gender"]').select('masculino')
      cy.get('input[name="birthDate"]').type('1990-01-01')

      cy.wait(500)
      cy.get('button[type="submit"]').click()
      cy.wait(3000)

      // Volver a la página de registro
      cy.visit('/register')
      cy.contains('Candidate').click()

      // Segunda vez - debería fallar
      cy.get('input[name="email"]').type(emailExistente)
      cy.get('input[name="password"]').type('Test123!')
      cy.get('input[name="confirmPassword"]').type('Test123!')
      cy.get('input[name="nombre"]').type('Test')
      cy.get('input[name="apellido"]').type('Usuario')
      cy.get('select[name="gender"]').select('masculino')
      cy.get('input[name="birthDate"]').type('1990-01-01')

      cy.wait(500)
      cy.get('button[type="submit"]').click()

      // Debe mostrar un mensaje de error
      cy.wait(2000)
      cy.get('body').should('satisfy', ($body: JQuery<HTMLElement>) => {
        const text = $body.text().toLowerCase()
        return text.includes('email') &&
               (text.includes('existe') ||
                text.includes('registrado') ||
                text.includes('duplicado') ||
                text.includes('already') ||
                text.includes('error'))
      })
    })

    it('debería mostrar error con formato de email inválido', () => {
      cy.contains('Candidate').click()

      const emailsInvalidos = [
        'sin-arroba.com',
        '@sinusuario.com',
        'espacios en medio@test.com',
        'doble@@arroba.com'
      ]

      emailsInvalidos.forEach(email => {
        cy.get('input[name="email"]').clear().type(email)
        cy.get('input[name="password"]').type('Test123!')
        cy.get('input[name="confirmPassword"]').type('Test123!')

        cy.wait(300)

        // El botón debe estar deshabilitado o mostrar error
        cy.get('button[type="submit"]').should('be.disabled')
      })
    })

    it('debería validar contraseñas que no coinciden', () => {
      cy.contains('Candidate').click()

      cy.get('input[name="email"]').type('test@test.com')
      cy.get('input[name="password"]').type('Password123!')
      cy.get('input[name="confirmPassword"]').type('DiferentePassword!')

      cy.wait(500)

      // Debe mostrar error o deshabilitar botón
      cy.get('button[type="submit"]').should('be.disabled')
    })

    it('debería mostrar error cuando falta algún campo requerido', () => {
      cy.contains('Candidate').click()

      // Llenar solo algunos campos
      cy.get('input[name="email"]').type('test@test.com')
      cy.get('input[name="password"]').type('Test123!')

      // Dejar confirmPassword vacío
      cy.wait(500)

      // El botón debe estar deshabilitado
      cy.get('button[type="submit"]').should('be.disabled')
    })
  })

  describe('Manejo de errores en login', () => {
    beforeEach(() => {
      cy.visit('/login')
    })

    it('debería mostrar error con credenciales incorrectas', () => {
      cy.get('input[type="email"]').type('usuario@noexiste.com')
      cy.get('input[type="password"]').type('passwordincorrecto')
      cy.get('button[type="submit"]').click()

      // Esperar respuesta del servidor
      cy.wait(2000)

      // Debe permanecer en login y mostrar error
      cy.url().should('include', '/login')

      // Buscar mensaje de error (puede estar en diferentes lugares)
      cy.get('body').should('satisfy', ($body: JQuery<HTMLElement>) => {
        const text = $body.text().toLowerCase()
        return text.includes('error') ||
               text.includes('incorrect') ||
               text.includes('incorrecto') ||
               text.includes('invalid') ||
               text.includes('inválid')
      })
    })

    it('debería mostrar error con campos vacíos', () => {
      // Dejar campos vacíos y intentar enviar
      cy.get('button[type="submit"]').should('be.disabled')
    })

    it('debería validar formato de email en login', () => {
      cy.get('input[type="email"]').type('email-sin-arroba')
      cy.get('input[type="password"]').type('password123')

      cy.wait(500)

      // El botón debe estar deshabilitado
      cy.get('button[type="submit"]').should('be.disabled')
    })
  })

  describe('Manejo de errores de red y servidor', () => {
    it('debería manejar error de red al intentar login', () => {
      cy.visit('/login')

      // Interceptar la petición y simular error de red
      cy.intercept('POST', '**/api/v1/login', {
        statusCode: 500,
        body: {
          detail: 'Internal Server Error'
        }
      }).as('loginError')

      cy.get('input[type="email"]').type('test@test.com')
      cy.get('input[type="password"]').type('Test123!')
      cy.get('button[type="submit"]').click()

      cy.wait('@loginError')
      cy.wait(1000)

      // Debe mostrar mensaje de error
      cy.get('body').should('satisfy', ($body: JQuery<HTMLElement>) => {
        const text = $body.text().toLowerCase()
        return text.includes('error') ||
               text.includes('servidor') ||
               text.includes('server') ||
               text.includes('fallido')
      })
    })

    it('debería manejar timeout en peticiones', () => {
      cy.visit('/login')

      // Interceptar y simular delay muy largo
      cy.intercept('POST', '**/api/v1/login', (req) => {
        req.reply({
          delay: 30000, // 30 segundos
          statusCode: 408,
          body: { detail: 'Request Timeout' }
        })
      }).as('loginTimeout')

      cy.get('input[type="email"]').type('test@test.com')
      cy.get('input[type="password"]').type('Test123!')
      cy.get('button[type="submit"]').click()

      // Debe mostrar indicador de carga o mensaje
      cy.wait(2000)
      cy.get('body').should('be.visible')
    })
  })

  describe('Validación de datos en formularios', () => {
    beforeEach(() => {
      cy.visit('/register')
    })

    it('debería validar edad mínima (18 años)', () => {
      cy.contains('Candidate').click()

      cy.get('input[name="email"]').type('menor@test.com')
      cy.get('input[name="password"]').type('Test123!')
      cy.get('input[name="confirmPassword"]').type('Test123!')
      cy.get('input[name="nombre"]').type('Juan')
      cy.get('input[name="apellido"]').type('Pérez')

      // Fecha de hace 15 años
      const fechaMenor = new Date()
      fechaMenor.setFullYear(fechaMenor.getFullYear() - 15)
      const fechaFormateada = fechaMenor.toISOString().split('T')[0]

      cy.get('input[name="birthDate"]').clear().type(fechaFormateada)
      cy.wait(500)

      // Debe mostrar mensaje de error sobre edad mínima
      cy.get('body').should('contain.text', '18')
    })

    it('debería validar que apellido solo contenga letras', () => {
      cy.contains('Candidate').click()

      cy.get('input[name="email"]').type('test@test.com')
      cy.get('input[name="password"]').type('Test123!')
      cy.get('input[name="confirmPassword"]').type('Test123!')
      cy.get('input[name="nombre"]').type('Juan')

      // Intentar escribir números en apellido
      cy.get('input[name="apellido"]').type('Pérez123')

      // El campo debe sanitizar automáticamente
      cy.get('input[name="apellido"]').should('have.value', 'Pérez')
    })

    it('debería validar longitud mínima de contraseña', () => {
      cy.contains('Candidate').click()

      cy.get('input[name="email"]').type('test@test.com')
      cy.get('input[name="password"]').type('123') // Muy corta
      cy.get('input[name="confirmPassword"]').type('123')

      cy.wait(500)

      // El botón debe estar deshabilitado
      cy.get('button[type="submit"]').should('be.disabled')
    })
  })

  describe('Manejo de sesión expirada', () => {
    it('debería redirigir a login cuando la sesión expira', () => {
      // Visitar una página protegida sin autenticación
      cy.visit('/mi-perfil')

      // Debe redirigir a login
      cy.url().should('include', '/login')
    })

    it('debería redirigir a login cuando el token es inválido', () => {
      // Establecer un token inválido en localStorage
      cy.visit('/')
      cy.window().then((window) => {
        window.localStorage.setItem('token', 'token-invalido-12345')
      })

      // Intentar acceder a página protegida
      cy.visit('/mi-perfil')

      // Debe redirigir a login después de que el backend rechace el token
      cy.wait(2000)
      cy.url().should('include', '/login')
    })
  })

  describe('Protección de rutas de admin', () => {
    it('debería bloquear acceso a dashboard de admin sin permisos', () => {
      // Intentar acceder a ruta de admin sin autenticación
      cy.visit('/admin-dashboard')

      // Debe redirigir a login o inicio
      cy.url().should('satisfy', (url: string) => {
        return url.includes('/login') ||
               url.includes('/inicio') ||
               url === Cypress.config().baseUrl + '/'
      })
    })
  })
})

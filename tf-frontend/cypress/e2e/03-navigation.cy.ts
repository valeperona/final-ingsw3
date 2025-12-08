describe('Navigation', () => {
  it('debería navegar correctamente entre páginas públicas', () => {
    cy.visit('/')

    // Verificar que la página principal carga
    cy.url().should('eq', Cypress.config().baseUrl + '/')

    // Navegar a Login
    cy.visit('/login')
    cy.url().should('include', '/login')
    cy.contains('Nice to see you again').should('be.visible')

    // Navegar a Registro
    cy.visit('/registro')
    cy.url().should('include', '/registro')
    // Verificar que estamos en la página de registro
    cy.get('body').should('be.visible')

    // Volver al inicio
    cy.visit('/')
    cy.url().should('eq', Cypress.config().baseUrl + '/')
  })

  it('debería tener navegación consistente', () => {
    cy.visit('/')
    // Verificar que existe navegación (nav, header, o links)
    cy.get('body').should('contain.text', 'Ingresar')

    cy.visit('/login')
    cy.get('body').should('be.visible')
  })

  it('debería proteger rutas de admin (sin estar autenticado)', () => {
    cy.visit('/admin-dashboard')

    // Debería redirigir a login o inicio
    cy.url().should('satisfy', (url: string) => {
      return url.includes('/login') || url.includes('/inicio') || url === Cypress.config().baseUrl + '/'
    })
  })
})

describe('Navigation', () => {
  it('debería navegar correctamente entre páginas públicas', () => {
    cy.visit('/')

    // Verificar que la página principal carga
    cy.url().should('eq', Cypress.config().baseUrl + '/')

    // Navegar a Login
    cy.visit('/login')
    cy.url().should('include', '/login')
    cy.get('h2, h1').should('contain.text', 'Iniciar')

    // Navegar a Registro
    cy.visit('/registro')
    cy.url().should('include', '/registro')
    cy.get('h2, h1').should('contain.text', 'Registr')

    // Volver al inicio
    cy.visit('/')
    cy.url().should('eq', Cypress.config().baseUrl + '/')
  })

  it('debería tener un header consistente', () => {
    cy.visit('/')
    cy.get('app-header').should('exist')

    cy.visit('/login')
    cy.get('app-header').should('exist')
  })

  it('debería proteger rutas de admin (sin estar autenticado)', () => {
    cy.visit('/admin-dashboard')

    // Debería redirigir a login o mostrar error
    cy.url().should('satisfy', (url: string) => {
      return url.includes('/login') || url.includes('/inicio')
    })
  })
})

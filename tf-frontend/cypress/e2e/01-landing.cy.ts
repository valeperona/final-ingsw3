describe('Landing Page', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('debería cargar la página principal correctamente', () => {
    cy.url().should('include', '/')
    cy.contains('Polo 52').should('be.visible')
  })

  it('debería tener el botón de login visible', () => {
    cy.contains('Iniciar Sesión').should('be.visible')
  })

  it('debería tener el botón de registro visible', () => {
    cy.contains('Registrarse').should('be.visible')
  })

  it('debería navegar a la página de login al hacer clic', () => {
    cy.contains('Iniciar Sesión').click()
    cy.url().should('include', '/login')
  })

  it('debería navegar a la página de registro al hacer clic', () => {
    cy.contains('Registrarse').click()
    cy.url().should('include', '/registro')
  })
})

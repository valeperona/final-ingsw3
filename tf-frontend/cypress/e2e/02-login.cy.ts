describe('Login Flow', () => {
  beforeEach(() => {
    cy.visit('/login')
  })

  it('debería mostrar el formulario de login', () => {
    cy.get('input[type="email"]').should('be.visible')
    cy.get('input[type="password"]').should('be.visible')
    cy.get('button[type="submit"]').should('be.visible')
  })

  it('debería mostrar error con credenciales inválidas', () => {
    cy.get('input[type="email"]').type('usuario@invalido.com')
    cy.get('input[type="password"]').type('passwordincorrecto')
    cy.get('button[type="submit"]').click()

    // Verificar que aparece mensaje de error
    cy.contains('Error').should('be.visible')
  })

  it('debería validar email requerido', () => {
    cy.get('input[type="password"]').type('password123')
    cy.get('button[type="submit"]').click()

    // El botón no debería funcionar sin email
    cy.url().should('include', '/login')
  })

  it('debería validar password requerido', () => {
    cy.get('input[type="email"]').type('test@test.com')
    cy.get('button[type="submit"]').click()

    // El botón no debería funcionar sin password
    cy.url().should('include', '/login')
  })

  it('debería redirigir después de login exitoso (cuando tengas un usuario de prueba)', () => {
    // Descomentar cuando tengas credenciales de prueba válidas
    // cy.get('input[type="email"]').type('admin@test.com')
    // cy.get('input[type="password"]').type('admin123')
    // cy.get('button[type="submit"]').click()
    // cy.url().should('not.include', '/login')
  })
})

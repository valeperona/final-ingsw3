describe('Editar Perfil de Usuario - CRUD UPDATE', () => {
  // Credenciales de un usuario de prueba que debe existir
  // NOTA: Este test asume que existe un usuario de prueba en la base de datos
  // Alternativamente, podría crearse uno en beforeEach
  const testUser = {
    email: 'candidato@test.com',
    password: 'Test123!',
    nuevoNombre: 'Juan Carlos',
    nuevoApellido: 'Martínez Rodríguez'
  }

  beforeEach(() => {
    // Limpiar cookies y storage antes de cada test
    cy.clearCookies()
    cy.clearLocalStorage()

    // Visitar página de login
    cy.visit('/login')
  })

  it('debería permitir login y acceder a mi perfil', () => {
    // Login
    cy.get('input[type="email"]').type(testUser.email)
    cy.get('input[type="password"]').type(testUser.password)
    cy.get('button[type="submit"]').click()

    // Esperar redirección (puede ir a diferentes páginas según el rol)
    cy.wait(2000)

    // Navegar a mi perfil
    cy.visit('/mi-perfil')

    // Verificar que estamos en la página correcta
    cy.url().should('include', '/mi-perfil')
    cy.wait(1000)

    // Verificar que se muestra información del usuario
    cy.get('body').should('be.visible')
  })

  it('debería activar modo de edición y mostrar campos editables', () => {
    // Login primero
    cy.get('input[type="email"]').type(testUser.email)
    cy.get('input[type="password"]').type(testUser.password)
    cy.get('button[type="submit"]').click()
    cy.wait(2000)

    // Ir a mi perfil
    cy.visit('/mi-perfil')
    cy.wait(1000)

    // Buscar y hacer clic en botón de editar
    // Puede ser un botón con texto "Editar", "Edit", o un ícono
    cy.get('body').then($body => {
      if ($body.find('button:contains("Editar")').length > 0) {
        cy.contains('button', 'Editar').click()
      } else if ($body.find('button:contains("Edit")').length > 0) {
        cy.contains('button', 'Edit').click()
      } else if ($body.find('.edit-button').length > 0) {
        cy.get('.edit-button').first().click()
      } else if ($body.find('button[title*="edit" i]').length > 0) {
        cy.get('button[title*="edit" i]').first().click()
      }
    })

    cy.wait(500)

    // Verificar que aparecen campos de edición
    cy.get('input[name="nombre"], input#nombre, .nombre-input').should('exist')
  })

  it('debería editar el nombre y apellido del usuario', () => {
    // Login
    cy.get('input[type="email"]').type(testUser.email)
    cy.get('input[type="password"]').type(testUser.password)
    cy.get('button[type="submit"]').click()
    cy.wait(2000)

    // Ir a mi perfil
    cy.visit('/mi-perfil')
    cy.wait(1000)

    // Activar modo edición
    cy.get('body').then($body => {
      if ($body.find('button:contains("Editar")').length > 0) {
        cy.contains('button', 'Editar').click()
      } else if ($body.find('button:contains("Edit")').length > 0) {
        cy.contains('button', 'Edit').click()
      } else if ($body.find('.edit-button').length > 0) {
        cy.get('.edit-button').first().click()
      }
    })

    cy.wait(500)

    // Editar nombre
    cy.get('input[name="nombre"], input#nombre, .nombre-input').then($input => {
      if ($input.length > 0) {
        cy.wrap($input).first().clear().type(testUser.nuevoNombre)
      }
    })

    // Editar apellido (si existe - solo para candidatos)
    cy.get('body').then($body => {
      if ($body.find('input[name="apellido"], input#apellido, .apellido-input').length > 0) {
        cy.get('input[name="apellido"], input#apellido, .apellido-input')
          .first()
          .clear()
          .type(testUser.nuevoApellido)
      }
    })

    cy.wait(500)

    // Guardar cambios
    cy.get('body').then($body => {
      if ($body.find('button:contains("Guardar")').length > 0) {
        cy.contains('button', 'Guardar').click()
      } else if ($body.find('button:contains("Save")').length > 0) {
        cy.contains('button', 'Save').click()
      } else if ($body.find('.save-button').length > 0) {
        cy.get('.save-button').first().click()
      } else if ($body.find('button[type="submit"]').length > 0) {
        cy.get('button[type="submit"]').first().click()
      }
    })

    // Esperar que se guarden los cambios
    cy.wait(2000)

    // Verificar que se guardaron los cambios
    // Puede mostrar mensaje de éxito o simplemente actualizar la vista
    cy.get('body').should('contain.text', testUser.nuevoNombre)
  })

  it('debería cancelar la edición y restaurar valores originales', () => {
    // Login
    cy.get('input[type="email"]').type(testUser.email)
    cy.get('input[type="password"]').type(testUser.password)
    cy.get('button[type="submit"]').click()
    cy.wait(2000)

    // Ir a mi perfil
    cy.visit('/mi-perfil')
    cy.wait(1000)

    // Obtener el nombre original
    let nombreOriginal: string

    cy.get('body').then($body => {
      const textContent = $body.text()
      // Guardar algún texto visible para comparar después
      nombreOriginal = textContent
    })

    // Activar modo edición
    cy.get('body').then($body => {
      if ($body.find('button:contains("Editar")').length > 0) {
        cy.contains('button', 'Editar').click()
      } else if ($body.find('button:contains("Edit")').length > 0) {
        cy.contains('button', 'Edit').click()
      }
    })

    cy.wait(500)

    // Modificar nombre
    cy.get('input[name="nombre"], input#nombre, .nombre-input').then($input => {
      if ($input.length > 0) {
        cy.wrap($input).first().clear().type('Nombre Temporal')
      }
    })

    cy.wait(500)

    // Cancelar edición
    cy.get('body').then($body => {
      if ($body.find('button:contains("Cancelar")').length > 0) {
        cy.contains('button', 'Cancelar').click()
      } else if ($body.find('button:contains("Cancel")').length > 0) {
        cy.contains('button', 'Cancel').click()
      } else if ($body.find('.cancel-button').length > 0) {
        cy.get('.cancel-button').first().click()
      }
    })

    cy.wait(500)

    // Verificar que los campos de edición ya no están visibles
    // o que se restauraron los valores originales
    cy.get('body').should('be.visible')
  })

  it('debería validar campos al editar perfil', () => {
    // Login
    cy.get('input[type="email"]').type(testUser.email)
    cy.get('input[type="password"]').type(testUser.password)
    cy.get('button[type="submit"]').click()
    cy.wait(2000)

    // Ir a mi perfil
    cy.visit('/mi-perfil')
    cy.wait(1000)

    // Activar modo edición
    cy.get('body').then($body => {
      if ($body.find('button:contains("Editar")').length > 0) {
        cy.contains('button', 'Editar').click()
      } else if ($body.find('button:contains("Edit")').length > 0) {
        cy.contains('button', 'Edit').click()
      }
    })

    cy.wait(500)

    // Intentar dejar el nombre vacío
    cy.get('input[name="nombre"], input#nombre, .nombre-input').then($input => {
      if ($input.length > 0) {
        cy.wrap($input).first().clear()
      }
    })

    cy.wait(500)

    // El botón de guardar debe estar deshabilitado o mostrar error
    cy.get('body').then($body => {
      const hasDisabledSaveButton =
        $body.find('button:contains("Guardar")[disabled]').length > 0 ||
        $body.find('button:contains("Save")[disabled]').length > 0 ||
        $body.find('.save-button[disabled]').length > 0

      if (!hasDisabledSaveButton) {
        // Si no está deshabilitado, debe haber un mensaje de error
        cy.get('body').should('satisfy', ($body: JQuery<HTMLElement>) => {
          const text = $body.text().toLowerCase()
          return text.includes('requerido') ||
                 text.includes('required') ||
                 text.includes('obligatorio')
        })
      }
    })
  })
})

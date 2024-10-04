/// <reference types="cypress" />

describe('Autenticação', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/login')
  })

  it('deve realizar login com sucesso', () => {
    cy.get('[data-testid="email-input"]').type('usuario@teste.com')
    cy.get('[data-testid="password-input"]').type('senha123')
    cy.get('[data-testid="login-button"]').click()

    cy.url().should('include', '/dashboard')
    cy.contains('Bem-vindo').should('be.visible')
  })

  it('deve exibir mensagem de erro para credenciais inválidas', () => {
    cy.get('[data-testid="email-input"]').type('usuario_invalido@teste.com')
    cy.get('[data-testid="password-input"]').type('senha_incorreta')
    cy.get('[data-testid="login-button"]').click()

    cy.contains('Credenciais inválidas').should('be.visible')
  })

  it('deve redirecionar para a página de registro', () => {
    cy.contains('Criar conta').click()
    cy.url().should('include', '/registro')
  })
})

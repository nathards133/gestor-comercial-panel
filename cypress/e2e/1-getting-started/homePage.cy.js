/// <reference types="cypress" />

describe('Página Inicial', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000') // Ajuste a URL conforme necessário
  })

  it('deve carregar a página inicial', () => {
    cy.contains('Mini Mercado') // Verifica se o título está presente
  })

  it('deve adicionar um produto ao carrinho', () => {
    cy.get('[data-testid="product-input"]').type('Maçã')
    cy.get('[data-testid="quantity-input"]').clear().type('2')
    cy.contains('Adicionar ao Carrinho').click()
    cy.contains('Maçã - 2x').should('be.visible')
  })

  it('deve remover um produto do carrinho', () => {
    // Primeiro, adiciona um produto
    cy.get('[data-testid="product-input"]').type('Banana')
    cy.get('[data-testid="quantity-input"]').clear().type('1')
    cy.contains('Adicionar ao Carrinho').click()

    // Agora, remove o produto
    cy.contains('Banana - 1x').parent().find('[data-testid="remove-product"]').click()
    cy.contains('Banana - 1x').should('not.exist')
  })

  it('deve finalizar uma venda', () => {
    // Adiciona um produto ao carrinho
    cy.get('[data-testid="product-input"]').type('Laranja')
    cy.get('[data-testid="quantity-input"]').clear().type('3')
    cy.contains('Adicionar ao Carrinho').click()

    // Finaliza a venda
    cy.contains('Finalizar Venda').click()
    cy.contains('Venda finalizada com sucesso').should('be.visible')
  })
})

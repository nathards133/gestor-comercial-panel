/* eslint-disable no-undef */
import React from 'react';
import ProductList from '../../src/components/ProductList';
import { mount } from 'cypress/react18';
import { AuthProvider } from '../../src/contexts/AuthContext';
import { BrowserRouter } from 'react-router-dom';

describe('ProductList Component', () => {
  beforeEach(() => {
    // Monta o componente dentro do AuthProvider e BrowserRouter antes de cada teste
    mount(
      <AuthProvider>
        <BrowserRouter>
          <ProductList />
        </BrowserRouter>
      </AuthProvider>
    );
  });

  it('deve permitir o cadastro de um novo produto', () => {
    // Abre o diálogo de cadastro de produto
    cy.get('button').contains('Adicionar Produto').click();

    // Preencher o formulário
    cy.get('input[name="name"]').type('Produto Teste');
    cy.get('input[name="price"]').type('10.00');
    cy.get('input[name="quantity"]').type('100');
    cy.get('input[name="barcode"]').type('1234567890123');
    cy.get('select[name="unit"]').select('unidade');

    // Submeter o formulário
    cy.get('button').contains('Salvar').click();

    // Verificar se o produto foi cadastrado
    cy.contains('Produto cadastrado com sucesso!').should('exist');
  });

  it('deve exibir uma mensagem de erro ao tentar cadastrar um produto sem nome', () => {
    // Abre o diálogo de cadastro de produto
    cy.get('button').contains('Adicionar Produto').click();

    // Preencher o formulário sem o nome
    cy.get('input[name="price"]').type('10.00');
    cy.get('input[name="quantity"]').type('100');
    cy.get('input[name="barcode"]').type('1234567890123');
    cy.get('select[name="unit"]').select('unidade');

    // Submeter o formulário
    cy.get('button').contains('Salvar').click();

    // Verificar se a mensagem de erro é exibida
    cy.contains('O nome do produto é obrigatório').should('exist');
  });
});
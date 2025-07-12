/// <reference types="cypress" />

export {};

declare global {
  namespace Cypress {
    interface Chainable<any> {
      loginByApi(): Chainable<any>;
      addBun(bunName: string): Chainable<any>;
      addFilling(fillingName: string): Chainable<any>;
      orderBurger(): Chainable<any>;
      closeModalEsc(): Chainable<any>;
      closeModalOverlay(): Chainable<any>;
    }
  }
}

Cypress.Commands.add('loginByApi', () => {
  cy.request('POST', 'https://norma.nomoreparties.space/api/auth/login', {
    email: 'test_user@example.com',

    password: '12345678'
  }).then((res) => {
    const accessToken = res.body.accessToken.split('Bearer ')[1];
    const refreshToken = res.body.refreshToken;

    cy.setCookie('accessToken', accessToken);
    cy.window().then((win) => {
      win.localStorage.setItem('refreshToken', refreshToken);
    });


    cy.intercept('GET', '**/api/auth/user', {
      statusCode: 200,
      body: {
        success: true,
        user: {
          email: 'test_user@example.com',
          name: 'Test User'
        }
      }
    }).as('getUser');
  });
});

Cypress.on('window:before:load', (win) => {
  cy.spy(win, 'fetch').as('fetchSpy');
});

Cypress.Commands.add('addBun', (bunName: string) => {
  cy.contains(bunName).next().click();
});
Cypress.Commands.add('addFilling', (fillingName: string) => {
  cy.contains('Начинки').click();
  cy.contains(fillingName).next().click();
});
Cypress.Commands.add('orderBurger', () => {
  cy.contains('Оформить заказ').should('not.be.disabled').click();
});
Cypress.Commands.add('closeModalEsc', () => {
  cy.get('body').type('{esc}');
});
Cypress.Commands.add('closeModalOverlay', () => {
  cy.get('body').click(10, 10);
});

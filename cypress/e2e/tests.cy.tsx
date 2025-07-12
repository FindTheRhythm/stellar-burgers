import Cypress from 'cypress';
const BUN_R2D3 = 'Флюоресцентная булка R2-D3';
const FILLING_MARS = 'Биокотлета из марсианской Магнолии';
const FILLING_TAB = 'Начинки';
const ORDER_BTN = 'Оформить заказ';
const BUN_KRATOR = 'Краторная булка';
const BUN_KRATOR_N200I = 'Краторная булка N-200i';
const SAUCE_TAB = 'Соусы';
const SAUCE_SPACE = 'Соус фирменный Space Sauce';
const PROFILE_BTN = 'Личный кабинет';
const CHOOSE_BUNS = 'Выберите булки';
const CHOOSE_FILLING = 'Выберите начинку';
const ORDER_ID = 'идентификатор заказа';
const FORM_NAME = 'input[name="name"]';
const MODAL = '.modal';
const BODY = 'body';
const BUTTON = 'button';
const FORM = 'form';

describe('Тестирование функционала Stellar Burgers', () => {
  beforeEach(() => {
    cy.fixture('ingredients.json').as('ingredientsData');
    cy.fixture('user.json').as('userData');

    cy.intercept('GET', '/api/ingredients', {
      fixture: 'ingredients.json'
    }).as('getIngredients');

    cy.intercept('GET', '/api/auth/user', {
      fixture: 'user.json'
    }).as('getUser');

    cy.setCookie('accessToken', 'mockToken');
    cy.window().then(win => {
      win.localStorage.setItem('refreshToken', 'mockToken');
    });

    cy.visit('/');
    cy.contains('Соберите бургер', { timeout: 10000 }).should('exist');
  });

  describe('Базовый функционал конструктора', () => {
    it('Проверка начального состояния конструктора', () => {
      cy.contains(CHOOSE_BUNS).should('exist');
      cy.contains(CHOOSE_FILLING).should('exist');
    });

    it('Добавление булки в конструктор', () => {
      cy.contains(BUN_R2D3).next().click();
      cy.contains(BUN_R2D3, { timeout: 10000 }).should('exist');
    });

    it('Добавление начинки в конструктор', () => {
      cy.contains(FILLING_TAB).scrollIntoView().click({ force: true });
      cy.contains(FILLING_MARS).next().click();
      cy.contains(FILLING_MARS).should('exist');
    });

    it('Проверка переключения табов ингредиентов', () => {
      cy.contains('Булки').should('exist').and('have.text', 'Булки');
      
      cy.contains(SAUCE_TAB).click();
      cy.contains(SAUCE_SPACE).scrollIntoView().should('be.visible');
      
      cy.contains(FILLING_TAB).click();
      cy.contains(FILLING_MARS).scrollIntoView().should('be.visible');
    });

    it('Проверка отображения счетчика при добавлении ингредиентов', () => {
      cy.contains(BUN_R2D3).next().click();
      
      cy.contains(FILLING_TAB).click();
      cy.contains(FILLING_MARS).next().click();
    });
  });

  describe('Проверка интерфейса', () => {
    it('Проверка хедера приложения', () => {
      cy.get('header').within(() => {
        cy.get('nav').should('exist');
        cy.contains('Конструктор').should('exist');
        cy.contains('Лента заказов').should('exist');
        cy.contains(PROFILE_BTN).should('exist');
      });
    });

    it('Проверка отображения цены у ингредиентов', () => {
      cy.contains(BUN_KRATOR_N200I)
        .parent()
        .within(() => {
          cy.get('p').should('exist');
          cy.get('svg').should('exist');
        });
    });

    it('Не оформляет заказ без булки', () => {
      cy.get(BUTTON).contains(ORDER_BTN).click();
      cy.get(MODAL).should('not.exist');
    });
  });

  describe('Модальные окна и детали ингредиентов', () => {
    it('Открытие и закрытие модального окна ингредиента через ESC', () => {
      cy.contains(BUN_KRATOR).click();
      cy.url().should('include', '/ingredients/');
      cy.get(BODY).type('{esc}');
      cy.url().should('eq', 'http://localhost:4000/');
    });

    it('Закрытие модального окна через клик на оверлей', () => {
      cy.contains(BUN_KRATOR).click();
      cy.get(BODY).click(10, 10);
      cy.url().should('eq', 'http://localhost:4000/');
    });
  });

  describe('Оформление заказа', () => {
    it('Создание и оформление заказа с последующей очисткой конструктора', () => {
      cy.intercept('POST', '/api/orders', {
        fixture: 'makeOrder.json',
        statusCode: 200
      }).as('newOrder');

      cy.contains(BUN_R2D3).next().click();
      cy.contains(FILLING_TAB).scrollIntoView();
      cy.contains(FILLING_MARS).next().click();

      cy.contains(ORDER_BTN).should('not.be.disabled').click();
      cy.wait('@newOrder', { timeout: 30000 })
        .its('response.statusCode')
        .should('eq', 200);

      cy.contains(ORDER_ID).should('be.visible');
      cy.get(BODY).type('{esc}');
      cy.contains(CHOOSE_BUNS).should('exist');
    });

    it('Не оформляет заказ без булки', () => {
      cy.get(BUTTON).contains(ORDER_BTN).click();
      cy.get(MODAL).should('not.exist');

      cy.url().should('eq', 'http://localhost:4000/');
    });
  });
});

describe('Авторизация и личный кабинет', () => {
  it('Успешный вход и переход в профиль', () => {
    cy.intercept('GET', '/api/auth/user', {
      statusCode: 200,
      body: {
        success: true,
        user: {
          email: 'test_user@example.com',
          name: 'Test User'
        }
      }
    }).as('getUser');

    cy.loginByApi();
    cy.visit('/');
    
    cy.contains(PROFILE_BTN).should('be.visible').click();
    cy.wait('@getUser');

    cy.contains('Test User').click();
    cy.url().should('include', '/profile');

    cy.get(FORM, { timeout: 10000 }).should('exist');
    cy.get(FORM_NAME).should('have.value', 'Test User');
  });
});
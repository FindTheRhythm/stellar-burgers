describe('Тестирование функционала Stellar Burgers', () => {
  beforeEach(() => {
    cy.fixture('ingredients.json').as('ingredientsData');
    cy.fixture('user.json').as('userData');

    cy.intercept('GET', 'https://norma.nomoreparties.space/api/ingredients', {
      fixture: 'ingredients.json'
    }).as('getIngredients');

    cy.intercept('GET', 'https://norma.nomoreparties.space/api/auth/user', {
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
      cy.contains('Выберите булки').should('exist');
      cy.contains('Выберите начинку').should('exist');
    });

    it('Добавление булки в конструктор', () => {
      cy.contains('Флюоресцентная булка R2-D3').next().click();
      cy.contains('Флюоресцентная булка R2-D3', { timeout: 10000 }).should('exist');
    });

    it('Добавление начинки в конструктор', () => {
      cy.contains('Начинки').scrollIntoView().click({ force: true });
      cy.contains('Биокотлета из марсианской Магнолии').next().click();
      cy.contains('Биокотлета из марсианской Магнолии').should('exist');
    });

    it('Проверка переключения табов ингредиентов', () => {
      cy.contains('Булки').should('exist').and('have.text', 'Булки');
      
      cy.contains('Соусы').click();
      cy.contains('Соус фирменный Space Sauce').scrollIntoView().should('be.visible');
      
      cy.contains('Начинки').click();
      cy.contains('Биокотлета из марсианской Магнолии').scrollIntoView().should('be.visible');
    });

    it('Проверка отображения счетчика при добавлении ингредиентов', () => {
      cy.contains('Флюоресцентная булка R2-D3').next().click();
      
      cy.contains('Начинки').click();
      cy.contains('Биокотлета из марсианской Магнолии').next().click();
    });
  });

  describe('Проверка интерфейса', () => {
    it('Проверка хедера приложения', () => {
      cy.get('header').within(() => {
        cy.get('nav').should('exist');
        cy.contains('Конструктор').should('exist');
        cy.contains('Лента заказов').should('exist');
        cy.contains('Личный кабинет').should('exist');
      });
    });

    it('Проверка отображения цены у ингредиентов', () => {
      cy.contains('Краторная булка N-200i')
        .parent()
        .within(() => {
          cy.get('p').should('exist');
          cy.get('svg').should('exist');
        });
    });

    it('Не оформляет заказ без булки', () => {
      cy.get('button').contains('Оформить заказ').click();
      cy.get('.modal').should('not.exist');
    });
  });

  describe('Модальные окна и детали ингредиентов', () => {
    it('Открытие и закрытие модального окна ингредиента через ESC', () => {
      cy.contains('Краторная булка').click();
      cy.url().should('include', '/ingredients/');
      cy.get('body').type('{esc}');
      cy.url().should('eq', 'http://localhost:4000/');
    });

    it('Закрытие модального окна через клик на оверлей', () => {
      cy.contains('Краторная булка').click();
      cy.get('body').click(10, 10);
      cy.url().should('eq', 'http://localhost:4000/');
    });
  });

  describe('Оформление заказа', () => {
    it('Создание и оформление заказа с последующей очисткой конструктора', () => {
      cy.intercept('POST', 'api/orders', {
        fixture: 'makeOrder.json',
        statusCode: 200
      }).as('newOrder');

      cy.contains('Флюоресцентная булка R2-D3').next().click();
      cy.contains('Начинки').scrollIntoView();
      cy.contains('Биокотлета из марсианской Магнолии').next().click();

      cy.contains('Оформить заказ').should('not.be.disabled').click();
      cy.wait('@newOrder', { timeout: 30000 })
        .its('response.statusCode')
        .should('eq', 200);

      cy.contains('идентификатор заказа').should('be.visible');
      cy.get('body').type('{esc}');
      cy.contains('Выберите булки').should('exist');
    });

    it('Не оформляет заказ без булки', () => {
      cy.get('button').contains('Оформить заказ').click();
      cy.get('.modal').should('not.exist'); // если модалка появляется при заказе
      // или
      cy.url().should('eq', 'http://localhost:4000/');
    });
  });
});

describe('Авторизация и личный кабинет', () => {
  it('Успешный вход и переход в профиль', () => {
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

    cy.loginByApi();
    cy.visit('/');
    
    cy.contains('Личный кабинет').should('be.visible').click();
    cy.wait('@getUser');

    cy.contains('Test User').click();
    cy.url().should('include', '/profile');

    cy.get('form', { timeout: 10000 }).should('exist');
    cy.get('input[name="name"]').should('have.value', 'Test User');
  });
});
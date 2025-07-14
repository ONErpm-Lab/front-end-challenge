cy.intercept('GET', '/sua-rota-aqui').as('getData');
cy.visit('/sua-pagina-aqui');
cy.wait('@getData');
cy.get('.seu-card-selector').contains('Texto desejado');
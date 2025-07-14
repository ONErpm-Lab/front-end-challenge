Cypress.Commands.add('waitForRequestAndCheckText', (url, text) => {
	cy.intercept(url).as('getRequest');
	cy.wait('@getRequest');
	cy.contains(text).should('exist');
});
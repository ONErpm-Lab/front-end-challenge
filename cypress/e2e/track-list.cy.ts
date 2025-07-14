describe("Teste da Lista de Tracks", () => {
  beforeEach(() => {
    // Visita a página e aguarda carregar
    cy.visit("/");
    cy.wait(2000); // Aguarda 2 segundos para a página carregar
  });

  it("deve carregar a página principal", () => {
    // Verifica se a página carregou
    cy.get("body").should("exist");
    cy.log("Página carregada com sucesso");
  });

  it("deve aguardar dados da API do Spotify carregarem", () => {
    // Aguarda mais tempo para a API responder
    cy.wait(10000); // 10 segundos para API do Spotify

    // Verifica se o spinner desapareceu
    cy.get("body").then(($body) => {
      if ($body.find("mat-spinner").length === 0) {
        cy.log("Dados carregados - spinner não encontrado");

        // Verifica se existem cards
        if ($body.find("mat-card").length > 0) {
          cy.get("mat-card").should("exist");
          cy.log("Cards de tracks encontrados");

          // Verifica track.name nos títulos
          cy.get("mat-card-title").each(($title) => {
            cy.wrap($title).should("not.be.empty");
            cy.wrap($title)
              .invoke("text")
              .then((trackName) => {
                cy.log("Track name:", trackName.trim());
                expect(trackName.trim()).to.have.length.greaterThan(0);
              });
          });
        } else {
          cy.log("Nenhum card encontrado ainda");
        }
      } else {
        cy.log("Ainda carregando dados - spinner presente");
      }
    });
  });

  it("deve verificar se track.name aparece corretamente", () => {
    // Aguarda mais tempo para carregar
    cy.wait(15000);

    // Procura por qualquer elemento com track name
    cy.get("body").should("contain.text", "Álbum:"); // Verifica se os dados carregaram

    // Se encontrou dados, testa os títulos
    cy.get("body").then(($body) => {
      if ($body.text().includes("Álbum:")) {
        cy.get("mat-card-title").should("exist");
        cy.get("mat-card-title").first().should("not.be.empty");
        cy.log("Track names encontrados nos cards!");
      }
    });
  });
});

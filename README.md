## Projeto
Embora este desafio fosse focado em frontend, surgiu a necessidade de implementar um webservice atuando como um proxy para gerenciar as requisições do frontend. Esse intermediário possibilita uma conexão suave entre o frontend e o Spotify, pois a Web API do Spotify exige autenticação por meio de chaves secretas. O uso desse proxy evita a exposição direta da chave, cuida do processo de autenticação e gerencia os dados provenientes da Web API do Spotify.

### Pré-requisitos:
  Certifique-se de ter os seguintes softwares instalados em seu sistema operacional:
  - Npm
  - NodeJS v18
  - Bash
  - killall
  - lsof

  Também será necessário o seu Client ID e o Client Secret da [Web API do Spotify](https://developer.spotify.com/documentation/web-api).

### Features
  - Pesquisa de faixas pelo ISRC
  - Informações de cada faixa que são exibidas:
    - Thumb do album
    - Data de lançamento
    - Título da faixa
    - Lista dos artistas da faixa
    - Duração da faixa em minutos e segundos (mm:ss)
    - Player com prévia do áudio
    - Link para a página da faixa no Spotify
    - Indicação de disponibilidade da faixa no Brasil (BR)
  - Listagem alfabética das faixas por seus nomes
  - Aviso exibido quando a integração com o fornecedor de dados não está disponível.
### Tecnologias usadas:
  - Frontend:
    - Angular 13
  - Webservice:
    - NodeJS
    - Express

### Configurando ambiente:
  - Copie o arquivo .env.example
  - Cole a cópia no mesmo diretório e a renomeie para .env
  - Edite o arquivo .env da seguinte forma:
    - Atribua o seu Client ID a variável CLIENT_ID
    - Atribua o seu Client Secret a variável CLIENT_SECRET

### Executando o Projeto:
  Para rodar o projeto, siga os passos abaixo a partir da pasta raiz do projeto em seu terminal:
  - Instale as depêndencias do projeto:
  ```sh
    $ ./install.sh
  ```
  - Inicie o backend e o frontend:
  ```sh
    $ ./start.sh
  ```

### Encerrando a Execução:
  Para parar a execução do projeto, execute o seguinte comando a partir da pasta raiz do projeto em seu terminal:
  ```sh
    $ ./stop.sh
  ```

## Início

Bem vindo ao mundo da música!

Atualmente temos a necessidade de consumir os dados de faixas musicais através do código ISRC, que é uma das coisas mais importantes na indústria fonográfica.

Segundo [Abramus](https://www.abramus.org.br/musica/isrc/), ISRC (International Standard Recording Code ou Código de Gravação Padrão Internacional) é um padrão internacional de código para identificar de forma única as gravações (faixas).

Ele funciona como um código de barras da faixa.


## Problema

Durante o fechamento de contrato com um produtor, foram informados 10 ISRC's que não constam em nossas bases de dados, que seguem abaixo:

* US7VG1846811
* US7QQ1846811
* BRC310600002
* BR1SP1200071
* BR1SP1200070
* BR1SP1500002
* BXKZM1900338
* BXKZM1900345
* QZNJX2081700
* QZNJX2078148

Precisamos obter e exibir os seguintes dados:

* Thumb do álbum
* Data de lançamento
* Título da faixa
* Lista dos artistas da faixa
* Duração da faixa em minutos e segundos (mm:ss)
* Player com prévia do áudio
* Link para a página da faixa no Spotify
* Sinalização dizendo se a faixa está ou não disponível no Brasil (BR)

Por decisão técnica, precisamos exibí-los através de uma webpage pública, ordenados por título da faixa de forma alfabética, sem necessidade de armazenamento para consulta posterior.

Caso a integração com o fornecedor dos dados não esteja disponível, um alerta deve ser dado ao usuário.


## Requisitos

* Faça um fork deste repositório e abra um PR quando estiver finalizado.
* O frontend deve ser no  deve ser feito em Angular 10 ou superior.
* A página deve ser responsiva para atender todos os tipos de dispositivos.
* Use a API do Spotify: [https://developer.spotify.com/](https://developer.spotify.com/) para coletar os dados das faixas.


## Diferencial

* Desenvolver testes unitários e de integração.


## O que será avaliado

* Fidelidade às instruções.
* Padrões de projeto.
* Clean Code e boas práticas.
* Boas práticas de versionamento.


## Perfil que buscamos

* Comunicativo
* Autodidata
* Automotivado
* Curioso
* Gostar de trabalhar em equipe
* Compromissado

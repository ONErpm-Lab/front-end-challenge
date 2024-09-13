<a name="readme-top">En | Pt-br</a>

<br />
<div align="center">
<h3 align="center">Frontend Challenge Onerpm</h3>
  <p align="center">
    Projeto desenvolvido para o desafio de frontend da ONErpm
  </p>
  <p><a href="https://github.com/gabrielliosc/portifolio-app/issues">Report Bug</a></p>
</div>

<details>
  <summary>Table of contents | Súmario</summary>
  <ol>
    <li>
      <a href="#about-the-project">About the Project | Sobre o projeto</a>
      <ul>
        <li><a href="#built-with">Built With | Construído Utilizando</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started | Inicializando</a>
      <ul>
        <li><a href="#installation">Installation | Instalação</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage | Uso</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#contact">Contact | Contato</a></li>
    <li><a href="#credits">Credits | Créditos</a></li>
  </ol>
</details>

## About The Project | Sobre O Projeto

Welcome! This is a front-end project developed for the ONErpm frontend challenge. It does a query of 10 ISRC codes and returns the track information with the spotify API

<p>Bem vindo(a)! Esse é um pojeto de front-end desenvolvido para o desafio da ONErpm. Consiste em realizar a consulta de 10 códigos ISRC e retornar as informações da música utilizando a API do spotify</p>



<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Built With

[![Angular][Angular]][Angular-url] [![Saas][Saas.com]][Saas-url] [![TypeScript][TypeScript.com]][TypeScript-url]

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- GETTING STARTED -->
## Getting Started

First, install the dependencies needed to run this project

<p>Primeiro, instale as dependencias necessárias para rodar o projeto</p>

### Installation | Instalação

1. Clone the repo | Clone o repositório
   ```sh
   git clone https://github.com/gabrielliosc/portifolio-app.git
   ```
2. Install NPM packages | Instale os pacotes do NPM
   ```sh
   npm install
   ```
3. Create a .env file at project root and insert the API information | Crie um arquivo .env na raíz do projeto e insira as informações da API
   ```sh
   NG_APP_SPOTIFY_API_URL=''
   NG_APP_SPOTIFY_CLIENT_ID=''
   NG_APP_SPOTIFY_CLIENT_SECRET=''
   NG_APP_TOKEN_API_URL=''
   ```
4. Start the application | Comece a aplicação
    ```sh
   npm start
   ```
   Runs the app in the development mode.\ | Roda a aplicação no modo de desenvolvimento
   Open [http://localhost:4200](http://localhost:4200) to view it in the browser. | Para visualizar no browser abra [http://localhost:4200](http://localhost:4200)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Usage | Uso

Will be listed here the finished protoype demo | Será inserido aqui uma demo do uso do protótipo finalizado

https://github.com/user-attachments/assets/d72d8474-cc2c-4a8f-bc30-67c30855777c

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Roadmap

- [x] Menu Header
- [x] Footer
- [x] Card Component
- [x] Requisição do token pela API do spotify
- [x] Requisição da API do Spotify
- [x] Mensagem de dados não encontrados
- [x] Versão mobile

<p align="right">(<a href="#readme-top">back to top</a>)</p>

Thanks! Obrigada! 😄

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Contact | Contato

Gabrielli de Oliveira e Silva da Cruz- [Linkedin](https://www.linkedin.com/in/gabrielli-oliveira-cruz/) - gabrielli.osc@gmail.com
<p>Project Link | Link do Projeto: https://github.com/gabrielliosc/front-end-challenge</p>

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Credits | Créditos

* [PhosporIcons](https://phosphoricons.com/)
* [Icons8](https://icons8.com.br/)
* [Spotify](https://developer.spotify.com/documentation/web-api)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

[Angular]: https://img.shields.io/badge/Angular-f3084a?style=for-the-badge&logo=angular&logoColor=white
[Angular-url]: https://angular.dev/
[Saas.com]: https://img.shields.io/badge/SASS-cf649a?style=for-the-badge&logo=sass&logoColor=white
[Saas-url]: https://sass-lang.com/
[TypeScript.com]: https://img.shields.io/badge/Typescript-2f74c0?style=for-the-badge&logo=typescript&logoColor=white
[TypeScript-url]: https://www.typescriptlang.org/

## DESAFIO
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

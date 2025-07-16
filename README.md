# PokéEgg - Uma Pokédex Interativa com React

Bem-vindo à PokéEgg, uma aplicação web moderna e interativa que serve como uma Pokédex completa, permitindo aos utilizadores explorar o vasto mundo dos Pokémon. Este projeto foi construído com React e Vite, focando numa interface de utilizador rápida, responsiva e rica em funcionalidades.

**[➡️ Aceda à demonstração ao vivo aqui](https://pokedex-one-black-59.vercel.app/)**

---

## ✨ Funcionalidades Principais

* **Visualização Completa:** Navegue por uma lista com mais de 1000 Pokémon, desde a primeira até à mais recente geração.
* **Pesquisa Avançada:** Encontre Pokémon rapidamente pelo seu nome ou número de ID.
* **Filtragem por Tipo:** Filtre a lista por um ou até dois tipos de Pokémon em simultâneo para encontrar a combinação perfeita.
* **Painel de Detalhes Completo:** Ao selecionar um Pokémon, um painel lateral exibe informações detalhadas, incluindo:
    * Estatísticas base (HP, Ataque, Defesa, etc.).
    * Habilidades (incluindo habilidades ocultas).
    * Altura e peso.
    * Cadeia de evolução interativa e clicável.
* **Suporte a Múltiplas Formas:** Alterne entre as diferentes formas de um Pokémon, como Mega Evoluções, formas de Alola, Galar e Gigantamax.
* **Visualização de Artwork Shiny:** Com um simples clique, alterne entre a arte oficial normal e a versão *shiny* do Pokémon.
* **Suporte Multilíngue:** A interface pode ser alternada entre Português e Inglês.
* **Design Responsivo:** A experiência foi otimizada para uma visualização agradável tanto em desktops como em dispositivos móveis.

---

## 🛠️ Tecnologias Utilizadas

Este projeto foi desenvolvido utilizando as seguintes tecnologias e ferramentas:

* **[React](https://react.dev/)**: Biblioteca JavaScript para a construção da interface de utilizador.
* **[Vite](https://vitejs.dev/)**: Ferramenta de build moderna que oferece uma experiência de desenvolvimento extremamente rápida.
* **JavaScript (ES6+)**: Linguagem de programação principal.
* **CSS3**: Para estilização, utilizando conceitos modernos como Flexbox e Grid para criar layouts responsivos.
* **[PokeAPI](https://pokeapi.co/)**: A API RESTful utilizada como fonte de todos os dados dos Pokémon.
* **[Vercel](https://vercel.com/)**: Plataforma utilizada para o deploy e alojamento da aplicação.

---

## 🚀 Como Executar o Projeto Localmente

Para executar este projeto na sua máquina local, siga os passos abaixo.

### Pré-requisitos

* [Node.js](https://nodejs.org/) (versão 18 ou superior recomendada)
* Um gestor de pacotes como `npm`, `yarn` ou `pnpm` (recomenda-se `pnpm` para evitar problemas de dependência).

### Passos de Instalação

1.  **Clone o repositório:**
    ```bash
    git clone [https://github.com/LorenzzoMP/Pokedex.git]
    ```

2.  **Navegue para a pasta do projeto:**
    ```bash
    cd nome-da-pasta-do-projeto
    ```

3.  **Instale as dependências:**
    * Se estiver a usar `pnpm` (recomendado):
        ```bash
        pnpm install
        ```
    * Ou se preferir `npm`:
        ```bash
        npm install
        ```

4.  **Inicie o servidor de desenvolvimento:**
    ```bash
    pnpm dev
    # ou
    npm run dev
    ```

5.  **Abra o seu navegador:**
    Acesse [http://localhost:5173](http://localhost:5173) (ou o endereço que aparecer no seu terminal) para ver a aplicação a funcionar.

---

## 📱 Planos Futuros: Aplicação Móvel

O próximo grande passo para este projeto é a sua transformação numa aplicação móvel para iOS e Android. O plano de migração envolve a utilização de **[React Native](https://reactnative.dev/)** com o ecossistema **[Expo](https://expo.dev/)**.

A lógica de negócio existente (chamadas à API, filtros, etc.) será maioritariamente reaproveitada, enquanto a interface de utilizador será "traduzida" de componentes web (HTML/CSS) para componentes nativos (`<View>`, `<Text>`, `<FlatList>`, `StyleSheet`), garantindo uma experiência de utilizador totalmente otimizada para dispositivos móveis.

---

## 📄 Licença

Este projeto está licenciado sob a Licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

---

Feito por **[LorenzzoMP]**.

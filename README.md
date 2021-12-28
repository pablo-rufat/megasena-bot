# megasena-bot

### O megasena-bot tem duas funcionalidades:
  - consulta de um numero no ultimo sorteio acontecido (comando `/ganhei XX,XX,XX,XX,XX,XX`).
  - consulta dos resultados da megasena da virada das apostas que tenha adicionado no arquivo `apostas.json`.
    - pode ser alterado o dia do sorteio para funcionar com outro que não seja o da virada.

### Como iniciar o projeto:
- Criar um arquivo `userList.json` com o conteudo `[]` na raiz.
- Criar um arquivo `apostas.json` com suas apostas no seguinte formato:
```
[
  [1,2,23,45,49,56],
  [1,2,23,45,49,57],
  [1,2,23,45,49,58],
  [1,2,23,45,49,59]
]
```
- adicionar o token que vc gerou no @BotFather de Telegram na variavel de ambiente `BOT_KEY` do arquivo `.env`.

### Acknowledgments
- Para obter os resultados dos sorteios foi usada a [API](https://loteriascaixa-api.herokuapp.com/api) disponivilizada por [Gustavo Alves](https://github.com/guto-alves). O repositorio com o projeto está [aqui](https://github.com/guto-alves/loterias-api).

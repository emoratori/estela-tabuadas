# 🧮 Estela Tabuadas

PWA de tabuada (1×1 até 12×12) com repetição espaçada adaptativa, mascotes, ofensivas, mini-histórias e área dos pais.
HTML + Tailwind (CDN) + JavaScript puro. Dados salvos no `localStorage` do aparelho.

## Estrutura

```
index.html   app.js   styles.css   manifest.json   sw.js   README.md
icons/  icon.svg  icon-192.png  icon-512.png
```

## Publicar no GitHub Pages (conta emoratori)

1. Acesse https://github.com/new (logado como **emoratori**).
2. Nome do repositório: `estela-tabuadas` (pode ser outro). Deixe **Public** e clique em **Create repository**.
3. Na página do repositório, clique em **uploading an existing file**.
4. Arraste **o conteúdo** da pasta `estela-tabuadas` (os arquivos e a pasta `icons`), de modo que `index.html` fique na raiz do repositório. Clique em **Commit changes**.
5. Vá em **Settings → Pages**. Em *Build and deployment*, escolha **Deploy from a branch**, branch **main**, pasta **/ (root)**, e clique em **Save**.
6. Aguarde 1 a 2 minutos. O endereço será:
   `https://emoratori.github.io/estela-tabuadas/`
7. No celular, abra o link no **Chrome** (com internet na primeira vez) e toque em **⋮ → Instalar app** / **Adicionar à tela inicial**.

> Os caminhos são relativos, então funciona em qualquer nome de repositório ou subpasta.

## Offline
No primeiro acesso, o Service Worker guarda os arquivos e o Tailwind (CDN). Depois disso o app abre sem internet.
Para publicar uma atualização, aumente a versão em `sw.js` (`const V = 'estela-v2'`), senão o celular continua usando o cache antigo.

## Regras do jogo
- 144 combinações independentes (`7×3` ≠ `3×7`), peso inicial 10.
- Acerto: peso × 0,7 (mín. 1). Erro: peso × 2 (máx. 100). Sorteio por roleta ponderada, sem repetir a mesma conta em seguida.
- Pontos: 10 base + bônus de velocidade (até +10, nos primeiros 5 s) + bônus de sequência (a partir de 3 acertos seguidos).
- O tempo nunca bloqueia a pergunta.
- Rodadas de 10 perguntas, com uma mini-história sorteada em cada rodada.
- Mascotes desbloqueados por pontos **ou** dias seguidos (ver tela "Amigos").
- Área dos pais protegida por uma conta de somar com números de 3 dígitos; mostra estatísticas, mapa de prioridade 12×12, e permite zerar ou excluir o perfil.

## Dados
Ficam apenas no aparelho (chaves `et_cfg`, `et_profiles`, `et_p_<nome>`). Limpar os dados do Chrome apaga o progresso.

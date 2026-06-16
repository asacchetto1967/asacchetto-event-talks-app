# BigQuery Release Radar 📡

O **BigQuery Release Radar** é uma aplicação web moderna e interativa desenvolvida com **Python Flask** e **Vanilla JS/CSS** para monitorar, filtrar e compartilhar as notas de lançamento (release notes) do Google Cloud BigQuery.

## 🚀 Recursos Principais

- 🔄 **Sincronização em Tempo Real**: Coleta as notas diretamente do feed oficial do Google Cloud com um botão de atualização e indicador de carregamento animado.
- ⚡ **Cache em Memória**: Sistema de cache de 5 minutos que evita o bloqueio de requisições por limite de taxa (rate limiting) e garante respostas rápidas.
- 🎨 **Design Glassmorphic Premium**: Interface elegante em modo escuro com cores tailandesas modernas, sombras brilhantes, animações suaves e tipografia refinada.
- 🔍 **Filtro Avançado**: Busca instantânea por palavras-chave, filtragem por categorias dinâmicas (ex: Features, Deprecations, Resolved) e recorte temporal.
- 🐦 **Compartilhamento Otimizado (X/Twitter)**: Selecione qualquer novidade e abra uma gaveta flutuante para compor e enviar um tweet pré-formatado, com cálculo dinâmico do tamanho limite de 280 caracteres (ajustando links para os 23 caracteres exigidos pelo X).
- 📋 **Copiar para Área de Transferência**: Copie a postagem rapidamente com notificações flutuantes na tela.

## 🛠️ Tecnologias Utilizadas

- **Servidor (Backend)**: Python, Flask, Requests, BeautifulSoup4
- **Interface (Frontend)**: HTML5 Semântico, CSS3 (Glows, Grid, Variáveis), ES6 JavaScript, FontAwesome Icons
- **Tipografia**: Google Fonts (Outfit & Inter)

## 📂 Estrutura de Diretórios

```text
bq-releases-notes/
├── app.py                 # Servidor Flask e parser XML/HTML
├── requirements.txt       # Dependências de pacotes Python
├── templates/
│   └── index.html         # Página única do painel (Dashboard)
├── static/
│   ├── css/
│   │   └── style.css      # Estilização, temas e animações CSS
│   └── js/
│       └── app.js         # Lógica do cliente, filtragem e composição de tweets
└── README.md              # Documentação do projeto
```

## 💻 Instalação e Execução

### Pré-requisitos
* Python 3.10 ou superior instalado.

### Configuração
1. Navegue até o diretório do projeto:
   ```bash
   cd bq-releases-notes
   ```

2. Crie e ative um ambiente virtual:
   ```bash
   python -m venv .venv
   # No Windows (PowerShell):
   .\.venv\Scripts\Activate.ps1
   # No macOS/Linux:
   source .venv/bin/activate
   ```

3. Instale as dependências necessárias:
   ```bash
   pip install -r requirements.txt
   ```

4. Inicie o servidor de desenvolvimento:
   ```bash
   python app.py
   ```

5. Abra o navegador e acesse o endereço:
   [http://127.0.0.1:5000](http://127.0.0.1:5000)

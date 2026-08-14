# Alquimia do Bonsai

Site oficial da Alquimia do Bonsai / Bonsai Alchemy, criado para apresentar a marca, vender bonsai pelo WhatsApp, divulgar a escola, cursos, mentorias e o livro "Cuide da Sua Alma - Licoes do Bonsai".

## O que o site faz

- Apresenta a historia e o proposito da Alquimia do Bonsai.
- Organiza tres caminhos principais: comprar um bonsai, conhecer a escola e conhecer o livro.
- Exibe catalogo com bonsai e pre-bonsai reais.
- Abre conversas no WhatsApp com mensagens prontas para compra e atendimento.
- Alterna conteudo entre portugues e ingles.
- Reune redes sociais, materiais, contatos e informacoes institucionais.

## Tecnologias

- HTML
- CSS
- JavaScript
- Supabase Auth, Database e Storage para painel administrativo e catalogo
- Vercel para hospedagem

## Estrutura

- `index.html`: estrutura principal do site.
- `assets/site.css`: estilos visuais do site.
- `assets/app.js`: idioma, catalogo, videos, admin e integracoes.
- `assets/`: imagens, logos, livro e fotos do catalogo.
- `privacy.html`: politica de privacidade.
- `shipping.html`: politica de envio.
- `returns.html`: politica de trocas e devolucoes.
- `terms.html`: termos de uso.
- `sitemap.xml`: mapa do site enviado ao Google Search Console.
- `robots.txt`: instrucao de rastreamento para buscadores.
- `supabase-setup.sql`: estrutura de banco, seguranca e storage.
- `CATALOGO-ADMIN.md`: manual de uso do painel administrativo.
- `vercel.json`: rotas, headers de seguranca e configuracao de deploy.

## Rotas publicas

- `/`: pagina principal.
- `/book`: secao do livro.
- `/shop`: catalogo.
- `/courses`: cursos e escola.
- `/videos`: videos do YouTube.
- `/about`: sobre.
- `/contact`: contato.
- `/privacy`: politica de privacidade.
- `/shipping`: politica de envio.
- `/returns`: politica de trocas e devolucoes.
- `/terms`: termos de uso.

## Seguranca

- O login administrativo usa Supabase Auth.
- A escrita no catalogo depende de perfil admin em `admin_profiles`.
- Conteudo vindo do banco e tratado antes de aparecer no HTML.
- Headers de seguranca sao aplicados pela Vercel.
- A chave Supabase publicada no front-end e uma chave publica; a protecao real fica nas politicas RLS.

## Publicacao

Para publicar na Vercel:

```powershell
vercel --prod
```

# Catalogo administrativo real

Esta copia prepara o site para a ideia de catalogo real, mas o painel administrativo seguro nao deve guardar senha nem dados sensiveis dentro do `index.html`.

## Por que nao fazer so no HTML

Um site estatico publicado na Vercel nao tem banco de dados proprio. Se o admin editar produtos usando apenas JavaScript e `localStorage`, a mudanca fica salva somente no navegador daquele aparelho. Outros visitantes nao veriam as novas fotos, valores ou descricoes.

Colocar credenciais administrativas no codigo tambem deixa a senha publica, porque qualquer pessoa pode abrir o codigo-fonte do site.

## Estrutura implementada nesta copia

Esta copia ja esta configurada para usar:

- **Supabase Auth** para login administrativo.
- **Supabase Database** para produtos.
- **Supabase Storage** para fotos do catalogo.
- Site publico na **Vercel** lendo os produtos publicados.

Projeto Supabase configurado no HTML:

- URL: `https://fmerpowodhrgfdzjcckm.supabase.co`
- Chave publica: configurada no `index.html`

## Como ativar no Supabase

1. Abra o Supabase.
2. Entre no projeto `alquimia-do-bonsai`.
3. Va em **SQL Editor**.
4. Crie uma nova query.
5. Cole todo o conteudo de `supabase-setup.sql`.
6. Clique em **Run**.

## Como criar o admin da sua mae

1. Va em **Authentication > Users**.
2. Clique em **Add user**.
3. Crie o e-mail e a senha da administradora.
4. Volte em **SQL Editor**.
5. Rode este comando trocando o e-mail:

```sql
insert into public.admin_profiles (user_id, email, role)
select id, email, 'admin'
from auth.users
where email = 'EMAIL_DA_ADMIN_AQUI'
on conflict (user_id) do update
set email = excluded.email,
    role = 'admin';
```

Depois disso, esse e-mail consegue entrar no painel administrativo pelo proprio site.

## Campos do catalogo

Tabela sugerida: `catalog_items`

- `id`
- `active`
- `category`
- `name_pt`
- `name_en`
- `description_pt`
- `description_en`
- `price_brl`
- `price_usd`
- `age_pt`
- `age_en`
- `height_pt`
- `height_en`
- `image_url`
- `whatsapp_pt`
- `whatsapp_en`
- `sort_order`
- `updated_at`

## Regras de seguranca

- Leitura publica somente dos itens ativos.
- Escrita, edicao e exclusao apenas para usuarios administradores autenticados.
- Upload de imagens apenas para administradores.
- Nenhuma senha ou chave secreta dentro do HTML publico.

## Fluxo ideal para Luane/Alexandre

1. A administradora entra no painel.
2. Adiciona foto, nome, descricao, valor e categoria.
3. O sistema cria ou salva o link de WhatsApp com mensagem pronta.
4. O produto aparece automaticamente no catalogo publico.
5. Ao trocar PT/EN, o site mostra os textos e WhatsApp corretos.

## Como testar

1. Abra a copia do site.
2. Clique no icone de conta.
3. Entre com o e-mail admin criado no Supabase.
4. Abra **Itens da loja**.
5. Clique em **Adicionar item**.
6. Preencha nome, categoria, valor, descricao e envie uma foto.
7. Salve.
8. Volte para a loja e confirme se o item apareceu.
9. Clique em consultar e confirme se o WhatsApp abre com mensagem pronta.

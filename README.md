# PayCripto

Envios cripto com a fluidez do PIX e identidade clara para quem paga e recebe. Este README foi pensado para um dev solo: direto ao ponto, com objetivo, MVP, o que falta e como rodar.

## Visão em 30s
- Problema: pagar e receber cripto ainda é confuso (endereços longos, redes diferentes, medo de errar).
- Público: quem já usa PIX e quer a mesma simplicidade para cripto; creators e freelancers que recebem em stablecoins; builders que precisam validar o fluxo de envio.
- Proposta de valor: identidade PayCripto + fluxo estilo PIX, multilíngue (pt-BR/en-US/es-ES), focado em testes em testnets.

## MVP (estado atual)
- Landing e narrativa do produto em `app/page.tsx` (pt-BR) com call-to-action para `/pt-BR/cripto`, `/en-US/cripto` e `/es-ES/cripto`.
- Conexão de carteira via RainbowKit/Wagmi com WalletConnect (testnets: Base Sepolia, Sepolia, Arbitrum/Optimism/zkSync/BSC/Loopring).
- Saldo e conversão: lê saldo nativo da rede conectada e trata como “USDT de teste”, convertendo via CoinGecko para BRL/USD.
- Catálogo de destinatários: lista mock carregada no client; UI pronta para múltiplos endereços por contato.
- Wizard de envio com estimativa de taxa e conversão fiat (ETH/USDT/USDC). Hoje a confirmação é simulada (alert + log); não assina nem envia transação.
- Recebimento: exibe QR e permite copiar endereço conectado; scanner de QR para preencher endereço de destino.

## Próximos passos sugeridos (design thinking)
1) Validar desejo/clareza: testes com usuários para comprovar que “nome PayCripto + estilo PIX” reduz ansiedade de envio.  
2) Confiabilidade: persistir contatos reais no Supabase (tabela `recipients`) e permitir múltiplos endereços por contato.  
3) Operação real: plugar assinatura e envio on-chain (viem/wagmi), escolhendo assets suportados por rede e validando taxas.  
4) Identidade: reservar/validar nomes PayCripto (mapeamento nome → address) para evitar erros de digitação.  
5) Pós-envio: recibo compartilhável e histórico por usuário.  
6) Segurança UX: validações anti-erro (rede correta, checksums, limites, bloqueio se asset/chain não suportados).

## Pilha e arquitetura rápida
- Front: Next.js (App Router, TypeScript), Tailwind utility classes, Framer Motion, lucide-react.
- i18n: `next-intl` com rotas `pt-BR`, `en-US` e `es-ES`.
- Web3: RainbowKit + Wagmi + viem com testnets pré-configuradas.
- Dados: Supabase client pronto (`src/infrastructure/supabase/*`) para salvar/ler `recipients`; hoje a UI usa mock em memória.
- Estado/async: React Query para requests web3 e dados.
- Organização: domínio/uso de casos em `src/core`, UI em `src/presentation`, helpers em `src/lib`.

## Estrutura útil
- `app/page.tsx` — landing e narrativa do produto.
- `app/[locale]/cripto/page.tsx` — produto principal (pt/en/es).
- `src/presentation/components/cripto/*` — cards, wizard de envio, lista de contatos, scanner/QR.
- `src/presentation/providers/web3-provider.tsx` — configuração de RainbowKit/Wagmi (testnets + WalletConnect).
- `src/infrastructure/supabase` — client e repository para contatos.
- `src/lib/currency.ts` — mapeamento de moedas, chains e conversão via CoinGecko.

## Fluxo do usuário (atual)
1) Cria/desbloqueia carteira Web3 (MetaMask/Rabby).  
2) Conecta no botão RainbowKit.  
3) Vê saldo (testnet) e conversão para BRL/USD.  
4) Escolhe destinatário da lista ou adiciona (mock).  
5) Preenche valor e asset; vê estimativa de taxa (simulada) e conversão fiat.  
6) Confirma (simulação); volta para a home.  
7) Pode copiar/compartilhar endereço ou QR para receber.

## Limites atuais
- Não há envio real on-chain (confirmação é simulada).
- Lista de contatos não persiste sem integrar Supabase.
- Os contratos USDT em testnet são tratados como mock; saldo vem da moeda nativa da rede conectada.

## Ambiente
Crie `.env.local` com:
```
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=seu-project-id
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```
- WalletConnect é necessário para abrir o modal de conexão.
- Supabase é opcional; sem ele, os contatos ficam apenas em memória.

## Como rodar
1) Node 18.17+ (recomendado 20).  
2) Instale deps: `npm install`  
3) Dev: `npm run dev` e abra `http://localhost:3000`  
4) Build: `npm run build`  
5) Prod local: `npm run start` (após build)  
6) Lint: `npm run lint`

## Rotas
- `/` — landing (pt-BR).  
- `/pt-BR/cripto` — app em português.  
- `/en-US/cripto` — app em inglês.  
- `/es-ES/cripto` — app em espanhol.

## Ideias rápidas de validação
- Teste com 3–5 usuários gravando tela: mede tempo e erro ao enviar.  
- Pergunte “onde você travou?” e “o que te deu confiança?” após o fluxo.  
- Logue eventos de sucesso/abandono por etapa do wizard para priorizar ajustes.

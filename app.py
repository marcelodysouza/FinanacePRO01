import streamlit as st
import google.generativeai as genai
import pandas as pd
import plotly.express as px
import io

# --- 1. CONFIGURAÇÃO DE SEGURANÇA (LOGIN) ---
def check_password():
    if "authenticated" not in st.session_state:
        st.session_state.authenticated = False

    if not st.session_state.authenticated:
        st.sidebar.title("🔐 Acesso Restrito")
        usuario = st.sidebar.text_input("Utilizador")
        senha = st.sidebar.text_input("Senha", type="password")
        
        if st.sidebar.button("Entrar"):
            if usuario == "admin" and senha == "1234":
                st.session_state.authenticated = True
                st.rerun()
            else:
                st.sidebar.error("Utilizador ou senha incorretos")
        return False
    return True

# --- INÍCIO DO APLICATIVO ---
if check_password():
    # Configuração da API do Gemini
    genai.configure(api_key="SUA_CHAVE_AQUI") # Substitua pela sua chave real
    model = genai.GenerativeModel('gemini-1.5-flash')

    # Configuração da Página
    st.set_page_config(page_title="FinancePro", layout="wide", page_icon="💰")

    # Logout na barra lateral
    if st.sidebar.button("Sair / Logout"):
        st.session_state.authenticated = False
        st.rerun()

    # --- ESTADO DA SESSÃO (Banco de Dados) ---
    if 'dados' not in st.session_state:
        st.session_state.dados = pd.DataFrame([
            {"Data": "2023-12-01", "Descrição": "Venda Software", "Valor": 5000.00, "Categoria": "Receita"},
            {"Data": "2023-12-05", "Descrição": "Servidor AWS", "Valor": -1500.00, "Categoria": "Infraestrutura"}
        ])

    if 'lembretes' not in st.session_state:
        st.session_state.lembretes = []

    # --- NAVEGAÇÃO ---
    # Adicionamos "Lembretes" na lista abaixo
    menu = st.sidebar.selectbox("Menu Principal", ["Dashboard", "Transações", "Relatórios Detalhados", "Lembretes", "IA Advisor"])

    # --- TELAS ---
    if menu == "Dashboard":
        st.title("📊 Resumo Executivo")
        total_in = st.session_state.dados[st.session_state.dados['Valor'] > 0]['Valor'].sum()
        total_out = st.session_state.dados[st.session_state.dados['Valor'] < 0]['Valor'].sum()
        saldo = total_in + total_out

        c1, c2, c3 = st.columns(3)
        c1.metric("Entradas", f"R$ {total_in:,.2f}")
        c2.metric("Saídas", f"R$ {abs(total_out):,.2f}", delta_color="inverse")
        c3.metric("Saldo Atual", f"R$ {saldo:,.2f}")

        fig_evolucao = px.line(st.session_state.dados, x="Data", y="Valor", title="Movimentação Diária")
        st.plotly_chart(fig_evolucao, use_container_width=True)

    elif menu == "Transações":
        st.title("📝 Gerenciar Lançamentos")
        with st.expander("➕ Adicionar Nova Transação"):
            with st.form("form_transacao"):
                col_d, col_v, col_c = st.columns(3)
                data = col_d.date_input("Data")
                valor = col_v.number_input("Valor (Negativo para gastos)", step=100.0)
                cat = col_c.selectbox("Categoria", ["Receita", "Infraestrutura", "Marketing", "Pessoal", "Outros"])
                desc = st.text_input("Descrição")
                if st.form_submit_button("Salvar"):
                    nova_trans = pd.DataFrame([{"Data": str(data), "Descrição": desc, "Valor": valor, "Categoria": cat}])
                    st.session_state.dados = pd.concat([st.session_state.dados, nova_trans], ignore_index=True)
                    st.success("Adicionado!")
                    st.rerun()
        st.dataframe(st.session_state.dados, use_container_width=True)

    elif menu == "Relatórios Detalhados":
        st.title("📈 Análise de Gastos")
        df_pizza = st.session_state.dados.copy()
        df_pizza['Valor_Abs'] = df_pizza['Valor'].abs()
        fig_pizza = px.pie(df_pizza, values='Valor_Abs', names='Categoria', title="Distribuição")
        st.plotly_chart(fig_pizza)

        # Exportação
        st.divider()
        csv_data = st.session_state.dados.to_csv(index=False).encode('utf-8')
        st.download_button("Baixar CSV", data=csv_data, file_name='financeiro.csv')

    elif menu == "Lembretes":
        st.header("📅 Contas a Pagar & Lembretes")
        col_l1, col_l2 = st.columns([1, 2])
        
        with col_l1:
            st.subheader("Novo Lembrete")
            titulo_lembrete = st.text_input("O que pagar? (ex: Aluguel)")
            data_vencimento = st.date_input("Vencimento")
            if st.button("Agendar Lembrete"):
                if titulo_lembrete:
                    st.session_state.lembretes.append({
                        "Título": titulo_lembrete, 
                        "Data": str(data_vencimento), 
                        "Status": "Pendente"
                    })
                    st.success(f"Lembrete '{titulo_lembrete}' agendado!")
                    st.rerun()
                else:
                    st.warning("Digite um título.")

        with col_l2:
            st.subheader("Próximos Vencimentos")
            if st.session_state.lembretes:
                df_lembretes = pd.DataFrame(st.session_state.lembretes)
                st.table(df_lembretes)
                if st.button("Limpar Tudo"):
                    st.session_state.lembretes = []
                    st.rerun()
            else:
                st.info("Nenhum lembrete pendente.")

    elif menu == "IA Advisor":
        st.title("🤖 Consultoria IA")
        pergunta = st.text_input("Dúvida sobre suas finanças?")
        if st.button("Analisar"):
            contexto = f"Dados: {st.session_state.dados.to_dict()}"
            response = model.generate_content(f"{contexto}\n\nPergunta: {pergunta}")
            st.markdown(response.text)

else:
    st.warning("Por favor, faça login.")

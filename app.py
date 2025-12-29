import streamlit as st
import google.generativeai as genai
import pandas as pd

# 1. Configuração da API (Substitua pela sua chave)
# Você encontra sua chave no ícone de engrenagem à esquerda da sua foto
genai.configure(api_key="AIzaSyCnu_axZkHfr4LAvFkNFiHeQZxocYS6Zi8")
model = genai.GenerativeModel('gemini-1.5-flash')

# Configuração da página
st.set_page_config(page_title="FinancePro - Fluxo de Caixa", layout="wide")

# --- BARRA LATERAL (Simulando o File Explorer) ---
st.sidebar.title("💰 FinancePro")
menu = st.sidebar.radio("Navegação", ["Dashboard", "Transações", "Relatórios", "IA Advisor"])

# --- MOCK DATA (Simulando o Banco de Dados) ---
if 'dados' not in st.session_state:
    st.session_state.dados = pd.DataFrame(
        [{"Data": "2023-12-01", "Descrição": "Venda Cliente A", "Valor": 5000.00, "Tipo": "Receita"},
         {"Data": "2023-12-02", "Descrição": "Aluguel Escritório", "Valor": -1200.00, "Tipo": "Despesa"}]
    )

# --- TELAS ---

if menu == "Dashboard":
    st.header("📊 Dashboard Financeiro")
    col1, col2, col3 = st.columns(3)
    
    total_receita = st.session_state.dados[st.session_state.dados['Valor'] > 0]['Valor'].sum()
    total_despesa = st.session_state.dados[st.session_state.dados['Valor'] < 0]['Valor'].sum()
    
    col1.metric("Receitas", f"R$ {total_receita:,.2f}")
    col2.metric("Despesas", f"R$ {abs(total_despesa):,.2f}", delta_color="inverse")
    col3.metric("Saldo Líquido", f"R$ {(total_receita + total_despesa):,.2f}")
    
    st.line_chart(st.session_state.dados.set_index("Data")["Valor"])

elif menu == "Transações":
    st.header("📝 Registro de Transações")
    with st.form("nova_transacao"):
        desc = st.text_input("Descrição")
        valor = st.number_input("Valor (Negativo para despesas)", format="%.2f")
        data = st.date_input("Data")
        if st.form_submit_button("Adicionar"):
            nova_linha = {"Data": str(data), "Descrição": desc, "Valor": valor, "Tipo": "Receita" if valor > 0 else "Despesa"}
            st.session_state.dados = pd.concat([st.session_state.dados, pd.DataFrame([nova_linha])], ignore_index=True)
            st.success("Registrado!")
    
    st.dataframe(st.session_state.dados, use_container_width=True)

elif menu == "IA Advisor":
    st.header("🤖 Inteligência Financeira (Gemini)")
    pergunta = st.text_area("Perunte sobre seu fluxo de caixa (ex: 'Como posso reduzir gastos?'):")
    
    if st.button("Consultar IA"):
        contexto = f"Meus dados atuais: {st.session_state.dados.to_string()}"
        response = model.generate_content(f"{contexto}\n\nPergunta do usuário: {pergunta}")
        st.info(response.text)

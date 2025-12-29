import streamlit as st
import google.generativeai as genai
import pandas as pd
import plotly.express as px # Biblioteca para gráficos bonitos

# 1. Configuração da API do Gemini
# Substitua pela chave que você encontra no ícone de engrenagem à esquerda na sua tela
genai.configure(api_key="AIzaSyCnu_axZkHfr4LAvFkNFiHeQZxocYS6Zi8")
model = genai.GenerativeModel('gemini-1.5-flash')

# Configuração da Página
st.set_page_config(page_title="FinancePro - Fluxo de Caixa", layout="wide", page_icon="💰")

# --- ESTADO DA SESSÃO (Banco de Dados Temporário) ---
if 'dados' not in st.session_state:
    st.session_state.dados = pd.DataFrame([
        {"Data": "2023-12-01", "Descrição": "Venda Software", "Valor": 5000.00, "Categoria": "Receita"},
        {"Data": "2023-12-05", "Descrição": "Servidor AWS", "Valor": -1500.00, "Categoria": "Infraestrutura"},
        {"Data": "2023-12-10", "Descrição": "Consultoria", "Valor": 2000.00, "Categoria": "Receita"},
        {"Data": "2023-12-15", "Descrição": "Marketing", "Valor": -800.00, "Categoria": "Marketing"}
    ])

# --- NAVEGAÇÃO LATERAL ---
st.sidebar.title("🚀 FinancePro")
st.sidebar.info("Fluxo de Caixa Inteligente")
menu = st.sidebar.selectbox("Ir para:", ["Dashboard", "Transações", "Relatórios Detalhados", "IA Advisor"])

# --- LÓGICA DAS TELAS ---

if menu == "Dashboard":
    st.title("📊 Resumo Executivo")
    
    # Métricas Principais
    total_in = st.session_state.dados[st.session_state.dados['Valor'] > 0]['Valor'].sum()
    total_out = st.session_state.dados[st.session_state.dados['Valor'] < 0]['Valor'].sum()
    saldo = total_in + total_out

    c1, c2, c3 = st.columns(3)
    c1.metric("Entradas", f"R$ {total_in:,.2f}")
    c2.metric("Saídas", f"R$ {abs(total_out):,.2f}", delta_color="inverse")
    c3.metric("Saldo Atual", f"R$ {saldo:,.2f}")

    # Gráfico de Evolução (Simulando o Dashboard.tsx da sua imagem)
    st.subheader("Evolução do Fluxo")
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
            desc = st.text_input("Descrição do lançamento")
            
            if st.form_submit_button("Salvar no Sistema"):
                nova_trans = pd.DataFrame([{"Data": str(data), "Descrição": desc, "Valor": valor, "Categoria": cat}])
                st.session_state.dados = pd.concat([st.session_state.dados, nova_trans], ignore_index=True)
                st.success("Transação adicionada com sucesso!")

    st.dataframe(st.session_state.dados, use_container_width=True)

elif menu == "Relatórios Detalhados":
    st.title("📈 Análise de Gastos e Receitas")
    
    col_left, col_right = st.columns(2)
    
    # Gráfico de Pizza por Categoria (Simulando o Reports.tsx)
    df_pizza = st.session_state.dados.copy()
    df_pizza['Valor_Abs'] = df_pizza['Valor'].abs()
    
    fig_pizza = px.pie(df_pizza, values='Valor_Abs', names='Categoria', title="Distribuição por Categoria")
    col_left.plotly_chart(fig_pizza)
    
    # Gráfico de Barras
    fig_barras = px.bar(st.session_state.dados, x="Categoria", y="Valor", color="Categoria", title="Saldo por Categoria")
    col_right.plotly_chart(fig_barras)

elif menu == "IA Advisor":
    st.title("🤖 Consultoria IA Financeira")
    st.write("O Gemini analisará seus dados para dar dicas de economia.")
    
    pergunta = st.text_input("O que deseja saber sobre suas finanças?")
    
    if st.button("Analisar com Gemini"):
        if pergunta:
            with st.spinner("Processando dados..."):
                # Enviamos os dados do DataFrame como contexto para a IA
                contexto = f"Dados financeiros atuais: {st.session_state.dados.to_dict()}"
                prompt_full = f"{contexto}\n\nUsuário pergunta: {pergunta}\nResponda como um consultor financeiro profissional."
                
                response = model.generate_content(prompt_full)
                st.markdown(f"### Resposta do Consultor:\n{response.text}")
        else:
            st.warning("Por favor, digite uma pergunta.")
# --- ABAIXO DOS GRÁFICOS NA SEÇÃO "Relatórios Detalhados" ---

st.divider() # Cria uma linha visual para separar
st.subheader("💾 Exportar Dados")

col_exp1, col_exp2 = st.columns(2)

# Função para converter o DataFrame para CSV
def converter_para_csv(df):
    return df.to_csv(index=False).encode('utf-8')

# Botão de Download para CSV
csv_data = converter_para_csv(st.session_state.dados)
col_exp1.download_button(
    label="Baixar Relatório em CSV",
    data=csv_data,
    file_name='relatorio_financeiro.csv',
    mime='text/csv',
)

# Botão de Download para Excel (Requer openpyxl)
try:
    import io
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
        st.session_state.dados.to_excel(writer, index=False, sheet_name='Transações')
    excel_data = output.getvalue()

    col_exp2.download_button(
        label="Baixar Relatório em Excel",
        data=excel_data,
        file_name='relatorio_financeiro.xlsx',
        mime='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    )
except ImportError:
    col_exp2.warning("Para exportar em Excel, instale: pip install xlsxwriter")
import streamlit as st
import google.generativeai as genai
import pandas as pd
import plotly.express as px
import io

# --- 1. CONFIGURAÇÃO DE SEGURANÇA (LOGIN) ---
def check_password():
    """Retorna True se o utilizador introduziu a senha correta."""
    if "authenticated" not in st.session_state:
        st.session_state.authenticated = False

    if not st.session_state.authenticated:
        st.sidebar.title("🔐 Acesso Restrito")
        usuario = st.sidebar.text_input("Utilizador")
        senha = st.sidebar.text_input("Senha", type="password")
        
        if st.sidebar.button("Entrar"):
            # Defina aqui o seu utilizador e senha desejados
            if usuario == "admin" and senha == "1234":
                st.session_state.authenticated = True
                st.rerun()
            else:
                st.sidebar.error("Utilizador ou senha incorretos")
        return False
    return True

# --- INÍCIO DO APLICATIVO ---

if check_password():
    # Botão de Logout na barra lateral
    if st.sidebar.button("Sair / Logout"):
        st.session_state.authenticated = False
        st.rerun()

    # 2. Configuração da API do Gemini
    genai.configure(api_key="SUA_CHAVE_AQUI")
    model = genai.GenerativeModel('gemini-1.5-flash')

    # Configuração da Página
    st.title("💰 FinancePro - Fluxo de Caixa")

    # --- ESTADO DA SESSÃO ---
    if 'dados' not in st.session_state:
        st.session_state.dados = pd.DataFrame([
            {"Data": "2023-12-01", "Descrição": "Venda Software", "Valor": 5000.00, "Categoria": "Receita"},
            {"Data": "2023-12-05", "Descrição": "Servidor AWS", "Valor": -1500.00, "Categoria": "Infraestrutura"}
        ])

    # --- NAVEGAÇÃO ---
    menu = st.sidebar.selectbox("Menu Principal", ["Dashboard", "Transações", "Relatórios Detalhados", "IA Advisor"])

    # [O restante do código das abas Dashboard, Transações e IA Advisor permanece o mesmo]

    if menu == "Relatórios Detalhados":
        st.header("📈 Análise de Gastos e Receitas")
        
        # Gráficos (Plotly)
        df_pizza = st.session_state.dados.copy()
        df_pizza['Valor_Abs'] = df_pizza['Valor'].abs()
        fig_pizza = px.pie(df_pizza, values='Valor_Abs', names='Categoria', title="Distribuição por Categoria")
        st.plotly_chart(fig_pizza)

        # --- SEÇÃO DE EXPORTAÇÃO ---
        st.divider()
        st.subheader("💾 Exportar Dados")
        
        col_exp1, col_exp2 = st.columns(2)

        # Exportar CSV
        csv_data = st.session_state.dados.to_csv(index=False).encode('utf-8')
        col_exp1.download_button("Baixar CSV", data=csv_data, file_name='financeiro.csv', mime='text/csv')

        # Exportar Excel
        try:
            output = io.BytesIO()
            with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
                st.session_state.dados.to_excel(writer, index=False)
            col_exp2.download_button("Baixar Excel", data=output.getvalue(), file_name='financeiro.xlsx')
        except:
            col_exp2.info("Instale 'xlsxwriter' para exportar em Excel")

else:
    st.warning("Por favor, faça login na barra lateral para aceder ao FinancePro.")
    st.info("Utilizador padrão: admin | Senha: 1234")   
# --- NOVO MENU: LEMBRETES ---
    elif menu == "Lembretes":
        st.header("📅 Contas a Pagar & Lembretes")
    
        col_l1, col_l2 = st.columns([1, 2])
    
        with col_l1:
            st.subheader("Novo Lembrete")
            titulo_lembrete = st.text_input("O que pagar? (ex: Aluguel)")
            data_vencimento = st.date_input("Vencimento")
        if st.button("Agendar Lembrete"):
            if titulo_lembrete:
                # Aqui o sistema simula a criação de uma tarefa
                st.success(f"Lembrete '{titulo_lembrete}' agendado para {data_vencimento}!")
                if 'lembretes' not in st.session_state:
                    st.session_state.lembretes = []
                st.session_state.lembretes.append({"Título": titulo_lembrete, "Data": str(data_vencimento), "Status": "Pendente"})
            else:
                st.warning("Digite um título para o lembrete.")

        with col_l2:
            st.subheader("Próximos Vencimentos")
        if 'lembretes' in st.session_state and st.session_state.lembretes:
            df_lembretes = pd.DataFrame(st.session_state.lembretes)
            st.table(df_lembretes)
            if st.button("Limpar Lembretes Concluídos"):
                st.session_state.lembretes = [l for l in st.session_state.lembretes if l['Status'] == 'Pendente']
                st.rerun()
        else:
            st.write("Nenhum lembrete para os próximos dias.")    

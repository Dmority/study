import streamlit as st

# Set page config
st.set_page_config(
    page_title="My Streamlit App",
    page_icon="🚀",
    layout="wide"
)

# Main title
st.title("Welcome to My Streamlit Application!")

# Sidebar
st.sidebar.header("Navigation")
page = st.sidebar.selectbox("Choose a page", ["Home", "About", "Contact"])

if page == "Home":
    st.header("Home Page")
    st.write("This is the home page of your new Streamlit application.")
    
    # Add some interactive widgets
    name = st.text_input("Enter your name:")
    if name:
        st.write(f"Hello, {name}! Welcome to the app!")
    
    # Add a slider
    value = st.slider("Select a value", 0, 100, 50)
    st.write(f"You selected: {value}")
    
    # Add a chart
    import pandas as pd
    import numpy as np
    
    chart_data = pd.DataFrame(
        np.random.randn(20, 3),
        columns=['A', 'B', 'C']
    )
    st.line_chart(chart_data)

elif page == "About":
    st.header("About")
    st.write("This is a sample Streamlit application created for demonstration purposes.")
    st.write("Streamlit is a powerful framework for building data applications quickly.")

elif page == "Contact":
    st.header("Contact")
    st.write("Feel free to reach out!")
    
    with st.form("contact_form"):
        email = st.text_input("Email")
        message = st.text_area("Message")
        submitted = st.form_submit_button("Submit")
        
        if submitted:
            st.success("Thank you for your message!")
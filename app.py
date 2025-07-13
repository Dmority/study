import streamlit as st

def main():
    st.title("Hello, Streamlit! 👋")
    
    st.write("Welcome to your first Streamlit application!")
    
    st.subheader("About this app")
    st.write("This is a simple hello world application built with Streamlit.")
    
    name = st.text_input("What's your name?")
    if name:
        st.write(f"Hello, {name}! Nice to meet you!")
    
    st.subheader("Try some features")
    
    if st.button("Click me!"):
        st.success("Button clicked! 🎉")
    
    st.write("---")
    st.write("Made with ❤️ using Streamlit")

if __name__ == "__main__":
    main()
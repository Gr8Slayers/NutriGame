import { StyleSheet } from 'react-native';

export default StyleSheet.create({
    container: {
    flex: 1,
    backgroundColor: '#473c33',
  },
   circle1: {
    position: 'absolute',
    left:-168,
    top:378,
    width:650,
    height:650,
    borderRadius: 350,
    backgroundColor:'#1f5809',
  },
  circle2: {
    position: 'absolute',
    left:73,
    top:177,
    width:400,
    height:400,
    borderRadius: 200,
    backgroundColor:'#8db654',
  },
  circle3: {
    position: 'absolute',
    left:30,
    top:50,
    width:200,
    height:200,
    borderRadius: 100,
    backgroundColor:'#e2f0bd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    color: '#FFFFFF',
  },
  input: {
    backgroundColor: '#f7e5c5ff',
    fontSize: 16,
  },
   inputContainer: {
    elevation: 5,
    marginVertical: 16,
    paddingLeft: 8,
    paddingTop: 4,
    paddingBottom: 8,
    backgroundColor: '#f7e5c5ff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#0a0701ff',
  },
  label: {
    zIndex: 1,
    fontWeight:'bold',
    fontSize: 18,
    color: '#080808ff',
    paddingTop: 8,
    marginBottom: 8-5
  },
   linkText: {
    marginTop: 20,
    textAlign: 'center',
    color: '#f7e5c5ff',
    fontSize: 16,
  },
  signUpLinkText:{
    marginTop: 20,
    textAlign: 'center',
    color: '#db5b23',
    fontSize: 16,
  },
  button: {
  backgroundColor: '#fc8500',
  paddingHorizontal: 15,
  paddingVertical: 12,
  borderRadius: 8,
  alignItems: 'center',
  marginBottom: 15,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  divider: {
  height: 1,
  backgroundColor: '#ddd', 
  marginVertical: 20,       // üst-alt boşluk
},
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#555',
    marginTop: 15,
    marginBottom: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 15,
  
  },

});
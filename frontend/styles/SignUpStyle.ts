import { StyleSheet } from 'react-native';

export default StyleSheet.create({
    container: {
    flex: 1,
    backgroundColor: '#473C33',
    flexDirection: 'column',
  },

leafContainer:{
    position:'absolute',
    top: '13%',
    left: '50%', 
    marginLeft: -50,
    width: 100,
    height: 100,
    zIndex: 10,

  },
  
  leaf1:{ // Koyu Yeşil Yaprak
    position: 'absolute', // MUTLAKA EKLE
    left: 50, // Container içinde sağa kaydır
    width: 90,
    height: 100,
    backgroundColor: '#2e7d32', // Koyu yeşil
    borderTopLeftRadius: 120,
    borderBottomRightRadius: 120,
    borderTopRightRadius: 20, 
    borderBottomLeftRadius: 20,
    transform: [{ rotate: '0deg' }],
    zIndex: 2,
  },
  leaf2:{ // Açık Yeşil Yaprak
    position: 'absolute', // MUTLAKA EKLE
    right: 55, // Container içinde sola kaydır
    top:10,
    width: 70,
    height: 85,
    backgroundColor: '#8bc34a', // Açık yeşil
    borderTopLeftRadius: 110,
    borderBottomRightRadius: 110,
    borderTopRightRadius: 15,
    borderBottomLeftRadius: 15,
    
    transform: [{ rotate: '-80deg' }], // Hafif eğim
    zIndex: 2,
  },
  backButton:{
     alignSelf: 'flex-start',
     left: 20,
     top:"5%"
  },
  

  dataContainer:{
    marginTop:'48%',
    flex: 1,
    backgroundColor: '#ABC270',
    borderRadius:40,
  },
  scrollContent: {
    flexGrow: 1,
    //justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    color: '#463C33',
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
    color: '#463C33',
    paddingTop: 8,
    marginBottom: 8-5
  },
   linkText: {
    marginTop: 20,
    textAlign: 'center',
    color: '#463C33',
    fontSize: 16,
  },
  signUpLinkText:{
    marginTop: 20,
    textAlign: 'center',
    color: '#db5b23',
    fontSize: 16,
  },
  button: {
  backgroundColor: '#Db5B23',
  paddingHorizontal: 15,
  paddingVertical: 12,
  borderRadius: 20,
  alignItems: 'center',
  marginBottom: 15,
  },
  buttonText: {
    color: '#ebe8e7ff',
    fontSize: 25,
    fontWeight: 'bold',
  },
  divider: {
  height: 1,
  backgroundColor: '#463C33', 
  marginVertical: 20,       // üst-alt boşluk
},
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#555',
    marginTop: 15,
    marginBottom: 10,
    borderTopWidth: 1,
    borderTopColor: '#463C33',
    paddingTop: 15,
  
  },

});
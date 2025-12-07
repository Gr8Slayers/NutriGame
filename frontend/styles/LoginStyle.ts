import { Platform, StatusBar, Dimensions,StyleSheet } from 'react-native';
const { height } = Dimensions.get('window');

export default StyleSheet.create({
 container: {
    flex: 1,
    backgroundColor: '#473C33',
    flexDirection: 'column',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 30,
    paddingBottom: 50,
  },

logoIcon: {
  position: 'absolute',
  width: 270,
  height: 250,
  resizeMode: 'contain'
},

leafContainer:{
    position:'absolute',
    top: height * 0.13,
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
    top:15,
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

  dataContainer:{
    marginTop: Platform.OS === 'ios' ? height*0.25 : height*0.20,
    flex: 1,
    backgroundColor: '#ABC270',
    borderRadius:40,
    overflow: 'hidden',
  },
  logInTitle: {
    fontSize: 30,
    textAlign: 'center',
    marginBottom: 20,
    color: '#473C33',
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: '#f7e5c5ff',
    fontSize: 16,
  },
   inputContainer: {
    marginVertical: 16,
    paddingLeft: 8,
    paddingTop: 4,
    paddingBottom: 8,
    backgroundColor: '#f7e5c5ff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#0a0701ff',
    // Android için gölge
    elevation: 5,

    // iOS için gölge (Bu kısmı eklersen iOS'te de derinlik olur)
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  label: {
    zIndex: 1,
    fontWeight:'bold',
    fontSize: 18,
    color: '#473C33',
    paddingTop: 8,
    marginBottom: 8-5
  },
  linkText: {
    marginTop: 20,
    textAlign: 'center',
    color: '#473C33',
    fontSize: 16,
  },
  signUpLinkText:{
    marginTop: 20,
    textAlign: 'center',
    color: '#db5b23',
    fontSize: 16,
    fontWeight:'bold',
  },
  button: {
  backgroundColor: '#Db5B23',
  paddingHorizontal: 15,
  paddingVertical: 12,
  borderRadius: 20,
  alignItems: 'center',
  marginBottom: 15,
  elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  buttonText: {
    color: '#ebe8e7ff',
    fontSize: 25,
    fontWeight: 'bold',
  },
  divider: {
  height: 1,
  backgroundColor: '#473C33', 
  marginVertical: 20,       // üst-alt boşluk
},
rememberContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 10,
},

checkbox: {
  width: 22,
  height: 22,
  borderWidth: 2,
  borderColor: '#473C33',
  borderRadius: 5,
  marginRight: 8,
  justifyContent: 'center',
  alignItems: 'center',
},
checkboxChecked: {
  backgroundColor: '#4caf50',
  borderColor: '#4caf50',
},
checkMark: {
  color: 'white',
  fontSize: 14,
  fontWeight: 'bold',
},

rememberText: {
  fontSize: 16,
  color: '#473C33',
},
});

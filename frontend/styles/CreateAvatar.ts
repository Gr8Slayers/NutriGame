import { Platform, StatusBar, Dimensions,StyleSheet } from 'react-native';
const { height } = Dimensions.get('window');

export default StyleSheet.create({
    container: {
    flex: 1,
    backgroundColor: '#473C33',
    flexDirection: 'column',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
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
    marginTop: Platform.OS === 'ios' ? height * 0.25 : height * 0.20,
    flex: 1,
    backgroundColor: '#ABC270',
    borderRadius:40,
  },
  backButton:{
     position: 'absolute', // ARTIK AKIŞI BOZMAZ (Yer kaplamaz)
    left: 20,
    // iOS ve Android için güvenli tepe boşluğu
    top: Platform.OS === 'ios' ? 50 : 20, 
    zIndex: 20, // En üstte görünsün
  },
  
   
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 30,
    paddingBottom: 50,
  },
  input: {
    backgroundColor: '#f7e5c5ff',
    fontSize: 16,
  },
   inputContainer: {
    marginVertical: 16,
    paddingLeft: 8,
    paddingRight: 8,
    paddingVertical: 8,
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
    }
  },
  label: {
    zIndex: 1,
    fontWeight:'bold',
    fontSize: 30,
    color: '#463C33',
    paddingTop: 8,
    textAlign:'center',
    marginBottom: 8-5
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 15,
    borderRadius: 16,
    padding: 8
  },
  avatarContainer: {
    borderRadius: 50,
    padding: 5,
    alignItems:'center',
  
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  selected: {
    borderWidth: 3,
    borderColor: '#47dd7c',
    backgroundColor: '#1a3b2e90',
  },
  button: {
  backgroundColor: '#Db5B23',
  paddingHorizontal: 15,
  paddingVertical: 12,
  borderRadius: 20,
  alignItems: 'center',
  marginBottom: 15,
  marginTop: 25,
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
  }
});
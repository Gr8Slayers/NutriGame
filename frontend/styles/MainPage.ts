import { StyleSheet, Platform, StatusBar, Dimensions } from 'react-native';

const { height, width } = Dimensions.get('window');

export default StyleSheet.create({
    container: {
    flex: 1,
    backgroundColor: '#473C33',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },

  mainChart: {
    paddingVertical: 30, 
    width: '100%',
    backgroundColor: "#ABC270", 
    
    borderBottomLeftRadius: width * 0.15,
    borderBottomRightRadius: width * 0.15,
    
    alignItems: "center",
    justifyContent: 'flex-end',
    paddingTop: height * 0.1,
    paddingBottom: 30,
    
    zIndex: 5,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
    scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  addMealCard: {
    flexDirection: "row",
    backgroundColor: '#f8d599ff',
    alignItems: "center",
    justifyContent: "space-between", 
    padding: 16,
    borderRadius: 20,
    marginBottom: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  labelContainer: {
    flexDirection: "column",
    flex: 1,
  },
  subtitle: {
    textAlign: 'center',
    color: '#5c544d',
    fontSize: 16,
    paddingLeft: 8,
  },
  mealTitle: {
    fontWeight:'bold',
    fontSize: 20,
    color: '#473C33',
    paddingTop: 8,
    paddingLeft: 8,
    marginBottom: 4
  },
  addButton: {
    backgroundColor: '#fc8500',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: "center",
    elevation:2,
  },
  
  plus: {
  fontSize: 40,  
  fontWeight: "bold",
  lineHeight: 40,
},
dateSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  dateText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fffbfbff',
  },
  iconContainer: {
  justifyContent: "center",
  width: 50,
  height: 50,
  backgroundColor: 'rgba(255,255,255,0.1)', 
  borderRadius: 10,
},
menuContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: 'flex-end', // Butonları alt hizada eşitlemek için
    marginBottom: 20,
    marginTop: 10,
    gap: 20,
},
chatButton: {
    backgroundColor: '#fc8500',
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
},
recipeButton: {
    backgroundColor: '#fc8500',
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
},
scanButton: {
    backgroundColor: '#fc8500',
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
}



})
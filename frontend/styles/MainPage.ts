import { StyleSheet, Platform, StatusBar, Dimensions } from 'react-native';

const { height, width } = Dimensions.get('window');

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#473C33',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#ABC270',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 10,
    zIndex: 10,
  },
  backButton: {
    padding: 8,
  },
  menuButton: {
    position: 'absolute',
    right: 10,
    top: Platform.OS === 'ios' ? 30 : 20,
    marginLeft: 'auto',
    zIndex: 20,

  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  mainChart: {
    width: '100%',
    backgroundColor: "#ABC270",

    borderBottomLeftRadius: width * 0.15,
    borderBottomRightRadius: width * 0.15,

    alignItems: "center",
    justifyContent: 'flex-end',
    paddingTop: height * 0.05,
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
    color: '#5c544d',
    fontSize: 16,
    paddingLeft: 8,
  },
  mealTitle: {
    fontWeight: 'bold',
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
    elevation: 2,
  },

  plus: {
    fontSize: 40,
    fontWeight: "bold",
    lineHeight: 40,
  },
  dateSelector: {
    alignItems: 'center',
    marginVertical: 10,
  },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(71, 60, 51, 0.4)', //(Glass effect)    
    borderRadius: 25,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },

  arrowButton: {
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
  },

  dateContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  dateText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5, // Harf aralığı
  },
  iconContainer: {
    justifyContent: "center",
    width: 50,
    height: 50,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
  },
  menuContainer: {
    alignSelf: 'center',
    backgroundColor: '#473C33',
    flexDirection: "row",
    justifyContent: "center",
    alignItems: 'flex-end', // Butonları alt hizada eşitlemek için
    width: width * 1,
    borderRadius: 25,
    paddingVertical: 10,
    zIndex: 10,
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    marginBottom: 8,
    marginTop: 10,
    gap: 20,
  },
  chatButton: {
    backgroundColor: '#fc8500',
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: "center",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  recipeButton: {
    backgroundColor: '#fc8500',
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: "center",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 3.84,
  },
  scanButton: {
    backgroundColor: '#fc8500',
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: "center",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 3.84,
  },
  rewardOverlay: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  rewardCard: {
    backgroundColor: '#14281d',
    padding: 40,
    borderRadius: 30,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#c8a96e',
    elevation: 20,
    shadowColor: '#c8a96e',
    shadowOpacity: 0.5,
    shadowRadius: 15,
  },
  rewardTitle: {
    color: '#f7e5c5',
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 20,
    textAlign: 'center',
  },
  rewardText: {
    color: '#c8a96e',
    fontSize: 18,
    marginTop: 10,
    fontWeight: '600',
  },



})
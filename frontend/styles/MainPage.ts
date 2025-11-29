import { StyleSheet } from 'react-native';

export default StyleSheet.create({
    container: {
    flex: 1,
    backgroundColor: '#473c33',
  },

  mainChart: {
    flex: 1,
    backgroundColor: "#8db654", 
    padding: 100,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    borderBottomLeftRadius: 80,
    borderBottomRightRadius: 80,  
    alignItems: "center", 
  },
    scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  addMealCard: {
    flexDirection: "row",
    backgroundColor: '#f8d599ff',
    alignItems: "center",
    justifyContent: "space-between", 
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  labelContainer: {
    flexDirection: "column",
  },
  subtitle: {
    textAlign: 'center',
    color: '#2e2b27ff',
    fontSize: 16,
    paddingLeft: 8,
  },
  mealTitle: {
    zIndex: 1,
    fontWeight:'bold',
    fontSize: 20,
    color: '#474242ff',
    paddingTop: 8,
    paddingLeft: 8,
    marginBottom: 8-5
  },
  addButton: {
    backgroundColor: '#fc8500',
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: "center",
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
    marginBottom: 16,
  },
  dateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fffbfbff',
  },
  iconContainer: {
  justifyContent: "center",
  width: 50,
  height: 50,
},
menuContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom:16,
    gap:16
},
chatButton: {
    backgroundColor: '#fc8500',
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: "center",
},
recipeButton: {
    backgroundColor: '#fc8500',
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: "center",
},
scanButton: {
    backgroundColor: '#fc8500',
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: "center",
}



})
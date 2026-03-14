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
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  backButton: {
    padding: 8,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  chartCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 25,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  chartTitle: {
    color: '#f7e5c5',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
  },
  barChartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 200,
    paddingBottom: 20,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
  },
  barBackground: {
    width: 12,
    height: 150,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
    backgroundColor: '#fc8500',
    borderRadius: 6,
  },
  dayText: {
    color: '#c8a96e',
    fontSize: 12,
    marginTop: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    width: '48%',
    borderRadius: 20,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  statLabel: {
    color: '#a0896e',
    fontSize: 14,
    marginBottom: 5,
  },
  statValue: {
    color: '#f7e5c5',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statUnit: {
    fontSize: 12,
    color: '#c8a96e',
    fontWeight: 'normal',
  },
  summaryCard: {
    backgroundColor: '#ABC270',
    borderRadius: 25,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryTextContainer: {
    flex: 1,
  },
  summaryTitle: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
  },
  summaryValue: {
    color: '#473C33',
    fontSize: 24,
    fontWeight: '900',
    marginTop: 5,
  },
  summaryIcon: {
    backgroundColor: 'rgba(0,0,0,0.1)',
    padding: 15,
    borderRadius: 20,
  }
});

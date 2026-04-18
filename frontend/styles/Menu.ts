import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a1812',
    },
    contentContainer: {
        padding: 20,
        paddingTop: 60,
        flexGrow: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 30,
        backgroundColor: '#14281d',
        padding: 20,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 8,
    },
    avatarContainer: {
        marginRight: 20,
        borderWidth: 2,
        borderColor: '#47dd7caf',
        borderRadius: 40,
        padding: 2,
    },
    avatar: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#2a3d33',
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#f7e5c5',
        marginBottom: 5,
    },

    streakLabel: {
        fontSize: 16,
        color: '#8e8e8e',
        marginBottom: 5,
    },
    streakContainer: {
        borderRadius: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        alignSelf: 'center',
    },
    streakValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    streakIconContainer: {
        padding: 10,
        borderRadius: 15,
        alignSelf: 'center',
    },

    goalContainer: {
        backgroundColor: '#14281d',
        padding: 20,
        borderRadius: 20,
        marginBottom: 30,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 5,
    },
    goalLabel: {
        fontSize: 16,
        color: '#8e8e8e',
        marginBottom: 5,
    },
    goalValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    goalIconContainer: {
        backgroundColor: 'rgba(247, 229, 197, 0.1)',
        padding: 10,
        borderRadius: 15,
    },
    menuList: {},
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#2a3d33',
        marginBottom: 5,
    },
    menuIconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#1c2e24',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    menuText: {
        fontSize: 16,
        color: '#f7e5c5',
        flex: 1,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#2a1a1a',
        padding: 16,
        borderRadius: 15,
        marginTop: 20,
        borderWidth: 1,
        borderColor: '#e57373',
    },
    logoutText: {
        color: '#e57373',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 10,
    },
    backButton: {
        marginBottom: 20,
        alignSelf: 'flex-start',
        padding: 10,
    }
});

export default styles;

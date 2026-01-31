import { StyleSheet, Platform, StatusBar, Dimensions } from 'react-native';

const { height, width } = Dimensions.get('window');

export default StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#473C33',
        flexDirection: "row",
        position: 'relative',
    },
    chatContainer: {
        flex: 1,
        backgroundColor: '#000000ff',
        paddingVertical: height * 0.05,
        paddingHorizontal: width * 0.02,
    },
    // Overlay for "tap outside to close"
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 5,
    },
    menuContainer: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        width: width * 0.7,
        backgroundColor: '#473C33',
        zIndex: 10,
        paddingTop: height * 0.08,
        paddingHorizontal: 20,
        shadowColor: "#000",
        shadowOffset: {
            width: 2,
            height: 0,
        },
        shadowOpacity: 0.5,
        shadowRadius: 5,
        elevation: 10,
        overflow: 'visible',
    },
    menuHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    menuTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    menuSubTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    closeButton: {
        padding: 5,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    menuIcon: {
        marginRight: 15,
    },
    menuText: {
        fontSize: 18,
        color: '#ffffff',
    },
    menuButton: {
        position: 'absolute',
        left: 20,
        top: Platform.OS === 'ios' ? 40 : 20,
        zIndex: 20,
    },
    newChatButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    botMessageContainer: {
        alignItems: 'flex-start',
        marginLeft: 0,
    },
    inputToolbar: {
        backgroundColor: 'transparent',
        paddingHorizontal: 15,
        paddingBottom: 10,
        borderTopWidth: 0,
    },
    inputContainer: {
        backgroundColor: '#f0f0f0',
        borderRadius: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        marginRight: 0,
    },
    composer: {
        backgroundColor: 'transparent',
        borderRadius: 25,
        paddingHorizontal: 10,
        paddingTop: Platform.OS === 'ios' ? 10 : 0,
        fontSize: 16,
        lineHeight: 22,
        marginRight: 10,
        marginTop: 6,
        marginBottom: 6,
    },
    sendContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 5,
        marginBottom: 0,
    },
    sendButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#000000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    botAvatar: {
        marginTop: 0,
        height: 40,
        width: 40,
        borderRadius: 20,
    },

    historyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },

    backButton: {
        position: 'absolute',
        right: 20,
        top: Platform.OS === 'ios' ? 40 : 20,
        zIndex: 20,
    },

});
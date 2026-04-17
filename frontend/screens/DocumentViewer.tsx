import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../App';
import { useLanguage } from '../i18n/LanguageContext';

export default function DocumentViewer() {
    const navigation = useNavigation();
    const route = useRoute<RouteProp<RootStackParamList, 'DocumentViewer'>>();
    const { documentType } = route.params;
    const { t, language } = useLanguage();

    let title = '';
    let content = '';

    if (documentType === 'kvkk') {
        title = t('kvkk_title');
        if (language === 'tr') {
            content = "1. Veri Sorumlusu\nNutriGame uygulaması olarak, kişisel verilerinizin güvenliği hususuna azami hassasiyet göstermekteyiz. Bu bilinçle, 6698 sayılı Kişisel Verilerin Korunması Kanunu (\"KVKK\") uyarınca verilerinizin nasıl işlendiği açıklanmaktadır.\n\n2. İşlenen Kişisel Veriler ve İşlenme Amaçları\nKullanıcı hesabı oluşturmanızla birlikte adınız, e-posta adresiniz, yaş, boy, kilo, cinsiyet ve diyet hedefleriniz ile uygulama içerisinde kaydettiğiniz günlük öğün, su ve fiziksel aktivite verileriniz işlenmektedir. Bu veriler; günlük kalori ihtiyacınızın hesaplanması, yapay zeka destekli NutriCoach hizmetinin sağlanması, sosyal akış içerisinde etkileşim kurmanız ve genel uygulama işlevlerinin yerine getirilmesi amacıyla toplanmaktadır.\n\n3. Verilerin Aktarılması\nKişisel verileriniz, kural olarak üçüncü taraflarla paylaşılmamaktadır. Ancak bulut altyapı hizmetleri, uygulama güvenliği ve anonimleştirilmiş analitik hizmetler sunan güvenilir teknoloji sağlayıcılarına yalnızca altyapı gereksinimleri sebebiyle mecburi ölçüde aktarılabilir.\n\n4. Veri Güvenliği ve Kullanıcı Hakları\nVerileriniz endüstri standartlarında şifreleme yöntemleri ile korunmaktadır. KVKK'nın 11. maddesi uyarınca dilediğiniz zaman profil ayarlarınız üzerinden verilerinizin güncellenmesini talep edebilir veya 'Hesabı Sil' özelliğiyle verilerinizin sistemden tamamen silinmesini ve yok edilmesini sağlayabilirsiniz.";
        } else {
            content = "1. Data Controller\nAt NutriGame, we attach utmost importance to the security of your personal data. In this context, we explain how your data is processed per the relevant personal data protection frameworks.\n\n2. Processed Data and Purposes\nAlong with account creation, your name, email, age, height, weight, gender, diet goals, and daily recorded meals/water are processed. This data is collected to calculate BMR/TDEE, provide the NutriCoach AI service, enable gamified challenges, and maintain overall application functionality.\n\n3. Data Transfer\nYour personal data is not sold or shared with third parties for marketing. It may only be transferred to secure technology providers, such as cloud hosting and analytics tools, strictly for maintaining app infrastructure.\n\n4. Data Security and User Rights\nYour data is protected by industry-standard encryption. You maintain the right to access, update, or completely delete your account at any time via the Profile Settings menu, which will irrevocably permanently erase your personal data from our servers.";
        }
    } else if (documentType === 'tos') {
        title = t('tos_title');
        if (language === 'tr') {
            content = "1. Taraflar ve Kabul\nNutriGame uygulamasına (\"Uygulama\") kayıt olarak ve kullanarak bu Kullanıcı Sözleşmesi'ni (\"Sözleşme\") kabul etmiş sayılırsınız.\n\n2. Tıbbi Tavsiye Niteliği Taşımaması\nUygulama içindeki kalori hedefleri, ScanFood yapay zeka analizleri ve NutriCoach botu tarafından sağlanan tavsiyeler tamamen oyunlaştırma, motivasyon ve genel bilgilendirme amaçlıdır. Hiçbir koşulda profesyonel tıbbi veya diyetetik tavsiye yerine geçemez. Sağlık sorunlarınız için lütfen uzman bir hekime veya diyetisyene başvurunuz.\n\n3. Kullanıcı İçerikleri ve Sorumluluk\nKullanıcılar, Sosyal Akış tarafında oluşturdukları tarifler, fotoğraflar ve yorumlardan bizzat kendileri sorumludur. NutriGame, başkalarının tariflerinin uygulanması sonucu oluşabilecek alerjen veya sağlık problemlerinden hukuki olarak sorumlu tutulamaz.\n\n4. Hesabın Feshi\nKurallara aykırı, tacizkâr veya zararlı içerik üreten kullanıcıların hesapları yöneticiler tarafından tespit edildiğinde hiçbir bildirim yapılmaksızın kalıcı olarak askıya alınabilir veya silinebilir.";
        } else {
            content = "1. Parties and Acceptance\nBy registering for and using NutriGame (\"Application\"), you agree to be bound by these Terms of Service.\n\n2. No Medical Advice\nThe daily calorie targets, ScanFood AI analysis, and NutriCoach bot recommendations are strictly for gamification, motivation, and informational purposes. They do not constitute professional medical or dietary advice. You should consult a healthcare professional before altering your diet.\n\n3. User-Generated Content\nUsers are solely responsible for recipes, formulas, and comments they post on the Social Feed. NutriGame cannot be held physically or legally responsible for any health issues, allergies, or damages resulting from trying recipes posted by other users.\n\n4. Account Termination\nWe reserve the right to suspend or permanently delete the accounts of users who post abusive, illegal, or harmful content, without prior notice.";
        }
    } else if (documentType === 'consent') {
        title = t('consent_title');
        if (language === 'tr') {
            content = "ÖZEL NİTELİKLİ KİŞİSEL VERİLERİN (SAĞLIK VERİLERİNİN) İŞLENMESİNE İLİŞKİN AÇIK RIZA BEYANI\n\nNutriGame uygulamasını kullanabilmem ve bana özel kalori, makro besin (TDEE) hesaplamalarının, meydan okuma ilerlemelerinin ve genel sağlık hedeflerinin doğru bir şekilde analiz edilebilmesi amacıyla;\n\nYaş, Boy, Kilo, Cinsiyet, Diyet Hedefi ve Tüketilen Besinler gibi 6698 sayılı KVKK kapsamında \"Özel Nitelikli Kişisel Veri\" statüsünde olan sağlık verilerimin, uygulamanın amacını gerçekleştirebilmesi, oyunlaştırma fonksiyonlarının aktif kalabilmesi ve bana yapay zeka tavsiyeleri (NutriCoach) sunulabilmesi sınırları dahilinde işlenmesine, kaydedilmesine, cihazlarım ve bulut sunucuları arasında aktarılmasına hiçbir baskı altında kalmadan, aydınlatılmış bir şekilde ve tamamen kendi hür irademle açık rıza gösteriyorum.\n\nBu rızamı her zaman hesabımı Profil Ayarları menüsünden tamamen silerek geri alabileceğimi anlıyor ve kabul ediyorum.";
        } else {
            content = "EXPLICIT CONSENT FOR PROCESSING HEALTH DATA\n\nIn order to use the NutriGame application and to accurately compute my daily caloric needs (TDEE), target weight, macro goals, and gamified challenge progressions;\n\nI hereby give my explicit, informed, and free consent for the processing, storage, and cross-device syncing of my \"Special Category Personal Data\" (health data), specifically including my Age, Height, Weight, Gender, Dietary Goals, and Daily Consumed Foods. I understand that this data is processed exclusively to provide me with personalized application features, gamification, and NutriCoach AI recommendations.\n\nI understand and acknowledge that I have the right to withdraw this consent at any time by completely deleting my account via the Profile Settings menu.";
        }
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#ffffff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{title}</Text>
                <View style={{ width: 24 }} />
            </View>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.text}>{content}</Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#0a1812',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#14281d',
        paddingTop: Platform.OS === 'android' ? 40 : 20,
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#47dd7caf',
        marginBottom: 20,
        textAlign: 'center',
    },
    text: {
        fontSize: 14,
        color: '#f7e5c5',
        lineHeight: 22,
    },
});

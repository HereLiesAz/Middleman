import SwiftUI
import ComposeApp

@main
struct iOSApp: App {
    /// The invite link that opened the app, if one did.
    @State private var invite: String?

    var body: some Scene {
        WindowGroup {
            ComposeView(invite: invite)
                .id(invite) // a new link starts the shared UI afresh, with that code
                .ignoresSafeArea()
                .preferredColorScheme(.dark)
                .onOpenURL { invite = $0.absoluteString }
        }
    }
}

/// Hosts the shared Compose UI (`MainViewController` in composeApp/iosMain).
struct ComposeView: UIViewControllerRepresentable {
    let invite: String?

    func makeUIViewController(context: Context) -> UIViewController { MainViewControllerKt.MainViewController(inviteUrl: invite) }
    func updateUIViewController(_ uiViewController: UIViewController, context: Context) {}
}

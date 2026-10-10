package no.watne.app

import no.watne.app.R

import android.content.Intent
import android.graphics.Color
import android.net.Uri
import android.net.http.SslError
import android.os.Bundle
import android.webkit.SslErrorHandler
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.net.toUri

class MainActivity : AppCompatActivity() {

    private var filePathCallback: ValueCallback<Array<Uri>>? = null

    // Moderne Activity Result Launcher for filvelger
    private val fileChooserLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == RESULT_OK && result.data != null) {
            val dataString = result.data?.dataString
            val results = if (dataString != null) arrayOf(dataString.toUri()) else null
            filePathCallback?.onReceiveValue(results)
        } else {
            filePathCallback?.onReceiveValue(null)
        }
        filePathCallback = null
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        val webView: WebView = findViewById(R.id.webView)

        // Bakgrunnsfarge for å forhindre hvit blink ved oppstart
        webView.setBackgroundColor(Color.parseColor("#0f172a"))

        // Robust WebViewClient for håndtering av nettverk og SSL
        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                return false // Tvinger alle interne sider til å åpnes inne i appen
            }

            override fun onReceivedSslError(view: WebView?, handler: SslErrorHandler?, error: SslError?) {
                handler?.proceed() // Fortsett lasting selv om Cloudflare SSL oppdaterer seg
            }

            override fun onReceivedError(view: WebView?, request: WebResourceRequest?, error: WebResourceError?) {
                if (request?.isForMainFrame == true) {
                    // Hvis live nettside feiler (f.eks. offline), last lokal kopi fra assets
                    view?.loadUrl("file:///android_asset/index.html")
                }
            }
        }

        // Håndter filvelger for logo-opplasting
        webView.webChromeClient = object : WebChromeClient() {
            override fun onShowFileChooser(
                webView: WebView?,
                filePathCallback: ValueCallback<Array<Uri>>?,
                fileChooserParams: FileChooserParams?
            ): Boolean {
                this@MainActivity.filePathCallback?.onReceiveValue(null)
                this@MainActivity.filePathCallback = filePathCallback

                val intent = Intent(Intent.ACTION_GET_CONTENT).apply {
                    addCategory(Intent.CATEGORY_OPENABLE)
                    type = "image/*"
                }

                try {
                    fileChooserLauncher.launch(Intent.createChooser(intent, "Velg bilde"))
                } catch (_: Exception) {
                    this@MainActivity.filePathCallback = null
                    return false
                }
                return true
            }
        }

        // WebView innstillinger for optimal ytelse og live-tilgang
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true // Tillater localStorage
            allowFileAccess = true
            allowContentAccess = true
            useWideViewPort = true
            loadWithOverviewMode = true
            databaseEnabled = true
        }

        // Håndtering av tilbakeknapp
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack()
                } else {
                    webView.evaluateJavascript("if (typeof gaaTilbakeNativ === 'function') { gaaTilbakeNativ(); } else { false; }") { result ->
                        if (result == "false" || result == null) {
                            isEnabled = false
                            onBackPressedDispatcher.onBackPressed()
                        }
                    }
                }
            }
        })

        // Laster inn den live oppdaterte nettsiden fra domenet watne.app
        webView.loadUrl("https://www.watne.app")
    }
}

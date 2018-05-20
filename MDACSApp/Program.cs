using System;
using System.Threading.Tasks;
using System.Text;
using System.IO;
using System.Collections.Generic;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using MDACS.Server;
using System.Diagnostics;

namespace MDACS.App
{    
    static class Handlers
    {
        public static async Task<Task> Index(ServerCore core, HTTPRequest request, Stream body, IProxyHTTPEncoder encoder)
        {
            return await core.ServeData("index.html", encoder);
        }

        public static async Task<Task> Utility(ServerCore core, HTTPRequest request, Stream body, IProxyHTTPEncoder encoder)
        {
            return await core.ServeData(request.query_string, encoder);
        }

        public static async Task<Task> GetConfig(ServerCore core, HTTPRequest request, Stream body, IProxyHTTPEncoder encoder)
        {
            await MDACS.Server.Util.ReadStreamUntilEndAndDiscardDataAsync(body);

            var resp = new JObject();

            resp["dbUrl"] = core.GetDatabaseUrl();
            resp["authUrl"] = core.GetAuthUrl();

            await encoder.WriteQuickHeader(200, "OK");
            await encoder.BodyWriteSingleChunk(JsonConvert.SerializeObject(resp));

            return Task.CompletedTask;
        }        
    }

    class ServerCore
    {
        private ProgramConfig cfg;

        public ServerCore(
            ProgramConfig cfg
        )
        {
            this.cfg = cfg;
        }

        public string GetDatabaseUrl() {
            return cfg.db_url;
        }

        public string GetAuthUrl() {
            return cfg.auth_url;
        }

        /// <summary>
        /// This will only allow valid characters. It returns a string with any non-valid
        /// characters removed. The valid characters are A-Z,a-z,0-9, and "._-". The valid
        /// list is strict to prevent any type of exploit for a path. This includes the
        /// exclusion of many unicode characters.
        ///
        /// If this is a hotspot a cache could be utilized.
        /// </summary>
        public string SanitizeDataName(string dataName) {
            var sb = new StringBuilder();

            foreach (var c in dataName) {
                int ci = (int)c;

                if (ci >= 'a' && ci <= 'z') {
                    sb.Append(c);
                    continue;
                } else if (ci >= 'A' && ci <= 'Z') {
                    sb.Append(c);
                    continue;
                } else if (ci >= '0' && ci <= '9') {
                    sb.Append(c);
                    continue;
                } else if (ci == '.') {
                    sb.Append(c);
                } else if (ci == '_') {
                    sb.Append(c);
                } else if (ci == '-') {
                    sb.Append(c);
                }
            }

            return sb.ToString();
        }

        public async Task<Task> ServeData(string dataName, IProxyHTTPEncoder encoder) {
            var dataNameSanitized = SanitizeDataName(dataName);
            var fullPath = Path.Combine(cfg.web_resources_path, dataNameSanitized);

            FileStream fp;

            try {
                fp = File.OpenRead(fullPath);
            } catch (FileNotFoundException) {
                return encoder.Response(404, "Not Found")
                    .ContentType("text/plain")
                    .CacheControlDoNotCache()
                    .SendString("Not Found");
            } catch (Exception ex) {
                return encoder.Response(500, "Internal Error")
                    .ContentType("text/plain")
                    .CacheControlDoNotCache()
                    .SendString(ex.ToString());
            }

            return await encoder.Response(200, "OK")
                .ContentType_GuessFromFileName(dataName)
                .CacheControlDoNotCache()
                .SendStream(fp);
        }
    }

    public struct ProgramConfig
    {
        public string auth_url;
        public string db_url;
        public ushort port;
        public string web_resources_path;
        public string ssl_cert_path;
        public string ssl_cert_pass;
    }

    public class Program
    {
        public static void Main(string[] args)
        {
            if (args.Length < 1)
            {
                Debug.WriteLine("Provide path or file that contains the JSON configuration. If file does not exit then default one will be created.");
                return;
            }

            if (!File.Exists(args[0]))
            {
                ProgramConfig defcfg = new ProgramConfig
                {
                    auth_url = "(required) The HTTP or HTTPS URL to the authentication service.",
                    db_url = "(required) The HTTP or HTTPS URL to the database service.",
                    port = 80,
                    web_resources_path = "(required) The path to the web resources to serve.",
                };

                var defcfgfp = File.CreateText(args[1]);
                defcfgfp.Write(JsonConvert.SerializeObject(defcfg, Formatting.Indented));
                defcfgfp.Dispose();

                Debug.WriteLine("Default configuration created at location specified.");
                return;
            }

            var cfgfp = File.OpenText(args[0]);

            var cfg = JsonConvert.DeserializeObject<ProgramConfig>(cfgfp.ReadToEnd());

            cfgfp.Dispose();

            var server_state = new ServerCore(cfg);

            var handlers = new Dictionary<String, SimpleServer<ServerCore>.SimpleHTTPHandler>();

            handlers.Add("/", Handlers.Index);
            handlers.Add("/utility", Handlers.Utility);
            handlers.Add("/get-config", Handlers.GetConfig);

            var server_task = SimpleServer<ServerCore>.Create(
                server_state,
                handlers,
                cfg.port,
                cfg.ssl_cert_path, 
                cfg.ssl_cert_pass
            );

            server_task.Wait();
        }
    }
}

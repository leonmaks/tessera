(ns upstream-parser-oracle
  (:require [logseq.graph-parser.mldoc :as mldoc]))

(let [encoded (aget js/process.argv 2)
      input (js/JSON.parse (.toString (js/Buffer.from encoded "base64")))
      format (keyword (or (.-format input) "markdown"))
      references (mldoc/get-references (.-content input) (mldoc/default-config format))]
  (println (js/JSON.stringify (clj->js references))))

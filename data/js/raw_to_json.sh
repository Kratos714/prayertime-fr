#!/bin/sh
#Usage : ./raw_to_json.sh city

/bin/echo `/bin/echo -n "var praytime_fr_$1 = [";cat ../raw/$1.txt | grep -oE '[0-9]{1,2}[ ]+[0-9]{1,2}h.*[0-9]{2}$' | sed -e 's/[ ]\{2\}/ /g' | sed -e 's/^\([0-9]\{1,2\}\)/"\1",/g' | sed -e 's/\([0-9]\{1,2\}h[0-9]\{1,2\}\)/"\1",/g'` | sed -e 's/,$/\];/' > $1.js

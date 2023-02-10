import time
import yaml
from yaml.loader import SafeLoader
from urllib.parse import urlparse


def get_app_version():
    # Read the version from the API YAML file
    try:
        with open("swagger.yaml") as f:
            data = yaml.load(f, Loader=SafeLoader)
            return data["info"]["version"]
    except Exception as e:
        print(e)
        return "?.?.?"


# Date
def timeNow():
    return time.time() * 1000


# Url
def is_url_valid(url):
    try:
        result = urlparse(url)
        return all([result.scheme, result.netloc])
    except:
        return False

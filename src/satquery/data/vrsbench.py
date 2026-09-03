from .schema import SatQuerySample


class VRSBenchAdapter:

    def __init__(self, sample):
        self.sample = sample

    def fields(self):
        return list(self.sample.keys())

    def describe(self):
        print("Available fields:")

        for field in self.fields():
            print("-", field)
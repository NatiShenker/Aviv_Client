namespace Aviv_Service.Models

{

 

    public class UnifiedLocationDto

    {

        public int LocationId { get; set; }

        public string LocationName { get; set; } = string.Empty;

        public int InstitutionId { get; set; }

        public int ParentId { get; set; } //

        public bool IsVirtual { get; set; }

        public bool HasDevice { get; set; }

    }

 

 

}